import Message from "../models/Message.js";
import { publisher } from "../lib/pubsub.js";
import { UploadObject } from "../lib/aws.js";

async function getChatMessages(req, res) {
  try {
    const { channelId } = req.params;
    const messages = await Message.find({ channelId })
      .populate("sender", "fullName profilePic")
      .populate({
        path: "parentMessage",
        populate: { path: "sender", select: "fullName profilePic" },
      });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function generateS3UploadUrl(req, res) {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      return res
        .status(400)
        .json({ error: "filename and contentType required" });
    }

    const { uploadUrl, downloadUrl } = await UploadObject(
      filename,
      contentType
    );

    res.json({ uploadUrl, downloadUrl });
  } catch (err) {
    console.error("Error generating signed URL:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

async function uploadFile(req, res) {
  try {
    console.log(req.body);
    const { channelId, senderId, fileUrl, fileType, fileName } = req.body;

    if (!channelId || !senderId || !fileUrl || !fileType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const message = new Message({
      channelId,
      sender: senderId,
      file: {
        url: fileUrl,
        type: fileType,
        name: fileName,
      },
    });

    await message.save();
    const populatedMessage = await Message.findById(message._id).populate(
      "sender"
    );

    // Publish file message
    await publisher.publish(
      `chat:${channelId}`,
      JSON.stringify({ type: "receive_message", payload: populatedMessage })
    );

    res.json(populatedMessage);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

export { getChatMessages, generateS3UploadUrl, uploadFile };
