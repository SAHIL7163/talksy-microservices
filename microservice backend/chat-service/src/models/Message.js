import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema({
  emoji: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const messageSchema = new mongoose.Schema(
  {
    channelId: { type: String, required: true },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: false },
    file: {
      url: { type: String, required: false },
      type: { type: String, required: false },
      name: { type: String, required: false },
    },
    isRead: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    parentMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    reactions: [reactionSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
