import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";
import { publisher } from "../lib/pubsub.js";

async function getRecommendedUser(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // Exclude current user
        { _id: { $nin: currentUser.friends } }, // Exclude friends
        { isOnboarded: true }, // Only onboarded
      ],
    });
    res.status(200).json(recommendedUsers);
  } catch (err) {
    console.error("Error in getRecommendedUser:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select("friends")
      .populate("friends", "fullName profilePic");

    res.status(200).json(user.friends);
  } catch (err) {
    console.error("Error in getMyFriends:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function sendFriendRequest(req, res) {
  try {
    const senderId = req.user.id;
    const receiverId = req.params.id;

    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ message: "You cannot send a friend request to yourself" });
    }

    // Check if the receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Check if already friends
    if (receiver.friends.includes(senderId)) {
      return res
        .status(400)
        .json({ message: "You are already friends with this user" });
    }

    // Check if a request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already exists" });
    }

    let newFriendRequest = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId,
    });

    newFriendRequest = await newFriendRequest.populate(
      "sender",
      "fullName profilePic"
    );

    await publisher.publish(
      `chat:${receiverId}`,
      JSON.stringify({
        type: "friend_request_received",
        payload: newFriendRequest,
      })
    );

    res.status(201).json(newFriendRequest);
  } catch (err) {
    console.error("Error in sendFriendRequest:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function acceptFriendRequest(req, res) {
  try {
    const userId = req.user.id;
    const requestId = req.params.id;
    let request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (request.receiver.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You can only accept requests sent to you" });
    }

    request.status = "accepted";
    await request.save();

    // Add each other to friends
    await User.findByIdAndUpdate(request.sender, {
      $addToSet: { friends: userId },
    });
    await User.findByIdAndUpdate(userId, {
      $addToSet: { friends: request.sender },
    });

    request = await FriendRequest.findById(requestId)
      .populate("sender", "fullName profilePic")
      .populate("receiver", "fullName profilePic");

    await publisher.publish(
      `chat:${request.sender._id}`,
      JSON.stringify({ type: "friend_request_accepted", payload: request })
    );

    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    console.error("Error in acceptFriendRequest:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getFriendRequests(req, res) {
  try {
    const incomingRequests = await FriendRequest.find({
      receiver: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic");

    const acceptedRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("receiver", "fullName profilePic");

    res.status(200).json({
      incomingRequests,
      acceptedRequests,
    });
  } catch (err) {
    console.error("Error in getFriendRequests:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getOutgoingFriendRequests(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("receiver", "fullName profilePic");

    res.status(200).json(outgoingRequests);
  } catch (err) {
    console.error("Error in getOutgoingFriendRequests:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export {
  getRecommendedUser,
  getMyFriends,
  sendFriendRequest,
  acceptFriendRequest,
  getFriendRequests,
  getOutgoingFriendRequests,
};
