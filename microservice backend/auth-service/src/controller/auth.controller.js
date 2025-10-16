import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { publisher } from "../lib/pubsub.js";

async function signup(req, res) {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fiels are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }
    const genders = ["male", "female"];
    const gender = genders[Math.floor(Math.random() * genders.length)];

    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${idx}&gender=${gender}`;

    const newUser = await User.create({
      fullName,
      email,
      password,
      profilePic: randomAvatar,
    });

    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true, // prevent xss attacks
      secure: process.env.NODE_ENV === "production", // use secure cookies in production
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (err) {
    console.log("error in signup controller:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const ispasswordMatch = await bcrypt.compare(password, user.password);
    if (!ispasswordMatch) {
      return res.status(400).json({ message: "Invalid  email or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true, // prevent xss attacks
      secure: process.env.NODE_ENV === "production", // use secure cookies in production
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    res.status(200).json({ success: true, user: user });
  } catch (err) {
    console.log("error in login controller:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

function logout(req, res) {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
}

async function onboard(req, res) {
  try {
    const userId = req.user._id;
    const { fullName, bio, location } = req.body;

    if (!fullName || !bio || !location) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !location && "location",
        ],
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await publisher.publish(
      "chat:global",
      JSON.stringify({
        type: "user:joined",
        payload: {
          _id: updatedUser._id,
          fullName: updatedUser.fullName,
          profilePic: updatedUser.profilePic,
          location: updatedUser.location,
          bio: updatedUser.bio,
        },
      })
    );

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    console.log("error in onboard controller:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getUserById(req, res) {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export { signup, login, logout, onboard, getUserById };
