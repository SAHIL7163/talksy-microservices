import express from "express";
import {
  getRecommendedUser,
  getMyFriends,
  sendFriendRequest,
  acceptFriendRequest,
  getFriendRequests,
  getOutgoingFriendRequests,
} from "../controller/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/recommended", protectRoute, getRecommendedUser);
router.get("/friends", protectRoute, getMyFriends);
router.post("/friend-request/:id", protectRoute, sendFriendRequest);
router.post("/accept-request/:id", protectRoute, acceptFriendRequest);
router.get("/friend-requests", protectRoute, getFriendRequests);
router.get("/outgoing-requests", protectRoute, getOutgoingFriendRequests);

export default router;
