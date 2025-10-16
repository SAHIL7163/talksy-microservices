import { kafka } from "./client.js";
import { publisher } from "../pubsub.js";
import Message from "../../models/Message.js";

export const consumer = kafka.consumer({ groupId: "chat-consumer" });

export const connectConsumer = async () => {
  try {
    await consumer.connect();
    console.log("Kafka consumer connected");

    await consumer.subscribe({ topic: "chat-messages", fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const { type, payload } = JSON.parse(message.value.toString());

          if (type === "send_message") {
            let savedMessage = await Message.create({
              channelId: payload.channelId,
              sender: payload.sender ? payload.sender._id : null,
              text: payload.text,
              parentMessage: payload.parentMessage ? payload.parentMessage._id : null,
              createdAt: payload.createdAt,
              file: payload.file,
            });

            savedMessage = await savedMessage.populate("sender", "fullName profilePic");

            if (savedMessage.parentMessage) {
              savedMessage = await savedMessage.populate({
                path: "parentMessage",
                populate: { path: "sender", select: "fullName profilePic" },
              });
            }

            const messageToSend = savedMessage.toObject();
            messageToSend.tempId = payload.tempId;

            await publisher.publish(
              `chat:${payload.channelId}`,
              JSON.stringify({ type: "receive_message", payload: messageToSend })
            );
          }
          else if (type === "message_deleted") {
            await Message.deleteOne({ _id: payload.messageId });
          }
          else if (type === "message_edited") {
            await Message.findByIdAndUpdate(
              payload.messageId,
              { text: payload.text, isEdited: true },
              { new: true }
            )

          }
          else if (type === "message_read") {
            const msg = await Message.findById(payload.messageId);
            if (msg) {
              msg.isRead = true;
              await msg.save();
            }
          }
          else {
            console.warn("Unknown Kafka event type:", type);
          }
        } catch (err) {
          console.error("Error processing Kafka message:", err);
        }
      },
    });
  } catch (err) {
    console.error("Error connecting Kafka consumer:", err);
  }
};
