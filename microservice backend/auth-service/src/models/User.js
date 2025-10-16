import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  profilePic: String,
  isOnboarded: { type: Boolean, default: false },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

export default mongoose.model("User", userSchema);
