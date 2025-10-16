import express from "express";
import "dotenv/config";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getChatMessages,
  generateS3UploadUrl,
} from "../controller/chat.controller.js";

const router = express.Router();
router.get("/messages/:channelId", protectRoute, getChatMessages);
router.post("/message/s3/generate-upload-url", generateS3UploadUrl);
export default router;
