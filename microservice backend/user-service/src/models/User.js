import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: String,
  profilePic: String,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isOnboarded: { type: Boolean, default: false },
});

export default mongoose.model("User", userSchema);
