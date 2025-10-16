import Message from "../models/Message.js";
import User from "../models/User.js";
import axios from "axios";
import mongoose from "mongoose";
import { publisher, subscriber } from "./pubsub.js";
import { producer } from "./kafka/producer.js";

export default function socketHandler(io) {
  io.on("connection", (socket) => {
  
    socket.on("register", ({ userId }) => {
      if (!userId) return;
      socket.join(userId.toString());
    });

    // Join Chat Room
    socket.on("join_room", (channelId) => {
      socket.join(channelId);
    });

    // Send Message
    socket.on("send_message", async (body) => {
      try {
        const {
          channelId,
          sender,
          text,
          parentMessage,
          tempId,
          createdAt,
          file,
        } = body;

        const message = {
          messageId: null,
          tempId,
          channelId,
          sender: sender,
          text,
          parentMessage:
            parentMessage && parentMessage !== "undefined"
              ? parentMessage
              : null,
          createdAt: createdAt,
          file,
        };

        await publisher.publish(
          `chat:${channelId}`,
          JSON.stringify({ type: "receive_message", payload: message })
        );

        await producer.send({
          topic: "chat-messages",
          messages: [
            {
              key: channelId.toString(),
              value: JSON.stringify({
                type: "send_message",
                payload: message,
              }),
            },
          ],
        });

        console.log("Message sent to Kafka topic 'chat-messages'");
      } catch (error) {
        io.emit("error_message", { message: "Failed to send message" });
      }
    });

    // Delete Message
    socket.on("delete_message", async ({ messageId, channelId }) => {
      await publisher.publish(
        `chat:${channelId}`,
        JSON.stringify({ type: "message_deleted", payload: { messageId } })
      );

      await producer.send({
        topic: "chat-messages",
        messages: [
          {
            key: channelId.toString(),
            value: JSON.stringify({
              type: "message_deleted",
              payload: { messageId, channelId },
            }),
          },
        ],
      });
    });

    // Edit Message
    socket.on("edit_message", async ({ messageId, channelId, text }) => {
      await publisher.publish(
        `chat:${channelId}`,
        JSON.stringify({ type: "message_edited", payload: { messageId, text } })
      );

      await producer.send({
        topic: "chat-messages",
        messages: [
          {
            key: channelId.toString(),
            value: JSON.stringify({
              type: "message_edited",
              payload: { messageId, text },
            }),
          },
        ],
      });
    });

    // Mark message as read
    socket.on("message_read", async ({ messageId, channelId }) => {
      await publisher.publish(
        `chat:${channelId}`,
        JSON.stringify({ type: "message_read", payload: { messageId } })
      );

      await producer.send({
        topic: "chat-messages",
        messages: [
          {
            key: channelId.toString(),
            value: JSON.stringify({
              type: "message_read",
              payload: { messageId },
            }),
          },
        ],
      });
    });

    // Typing Indicators
    socket.on("typing", ({ channelId, userId }) =>
      publisher.publish(
        `chat:${channelId}`,
        JSON.stringify({ type: "typing", payload: { userId } })
      )
    );

    socket.on("stop_typing", ({ channelId, userId }) =>
      publisher.publish(
        `chat:${channelId}`,
        JSON.stringify({ type: "stop_typing", payload: { userId } })
      )
    );

    // Video Call Events
    socket.on("start_video_call", ({ channelId }) =>
      publisher.publish(
        `chat:${channelId}`,
        JSON.stringify({ type: "start_video_call", payload: { channelId } })
      )
    );

    socket.on("end_video_call", ({ channelId }) =>
      publisher.publish(
        `chat:${channelId}`,
        JSON.stringify({ type: "end_video_call", payload: { channelId } })
      )
    );

    // AI Message
    socket.on("send_ai_message", async ({ channelId, senderId, text }) => {
      try {
        if (!text || !text.trim()) text = "[Empty message]";

        await Message.create({
          channelId,
          sender: senderId,
          text,
          isRead: true,
        });

        const recentMessages = await Message.find({ channelId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("text sender");

        let aiUser = await User.findOne({ email: "ai@example.com" });
        if (!aiUser) {
          aiUser = await User.create({
            fullName: "AI",
            email: "ai@example.com",
            password: new mongoose.Types.ObjectId().toString(),
          });
        }

        const aiUserId = aiUser._id;

        const history = recentMessages.reverse().map((msg) => ({
          role:
            msg.sender.toString() === aiUserId.toString() ? "model" : "user",
          parts: [{ text: msg.text || "[Empty message]" }],
        }));

        const messagesForGemini = [
          ...history,
          { role: "user", parts: [{ text }] },
        ];

        const GEMINI_MODEL = "gemini-2.5-flash";
        const GEMINI_API_VERSION = "v1";
        const GEMINI_URL = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await axios.post(
          GEMINI_URL,
          { contents: messagesForGemini },
          { headers: { "Content-Type": "application/json" } }
        );

        const aiResponse =
          response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
          "Sorry, I couldn't process that.";

        const aiMessage = await Message.create({
          channelId,
          sender: aiUserId,
          text: aiResponse,
        });

        await publisher.publish(
          `chat:${channelId}`,
          JSON.stringify({ type: "receive_ai_message", payload: aiMessage })
        );
      } catch (error) {
        console.error("Error details:", error.response?.data || error.message);

        let errorMessage = "Failed to send AI message";

        if (error.response?.status === 400)
          errorMessage =
            "Invalid request to AI model. Check message structure.";
        else if (
          error.response?.status === 401 ||
          error.response?.status === 403
        )
          errorMessage = "Authentication error. Check your API key.";
        else if (error.response?.status === 404)
          errorMessage = "AI model not found. Try using the v1 endpoint.";
        else if (error.response?.status === 429)
          errorMessage = "Rate limit exceeded. Wait and try again.";
        else if (error.response?.status >= 500)
          errorMessage = "AI server error. Try again later.";

        await publisher.publish(
          `chat:${channelId}`,
          JSON.stringify({ type: "error_message", payload: errorMessage })
        );
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Subscriber: listen to all chat channels
  subscriber.pSubscribe("chat:*", (message, channel) => {
    try {
      const channelId = channel.split(":")[1]; // e.g. roomId OR "global"
      const event = JSON.parse(message);

      if (channelId === "global") {
        // Broadcast to all connected sockets
        io.emit(event.type, event.payload);
      } else {
        // Broadcast only to the specific room
        io.to(channelId).emit(event.type, event.payload);
      }
    } catch (err) {
      console.error("Invalid message from Redis:", message, err);
    }
  });
}
