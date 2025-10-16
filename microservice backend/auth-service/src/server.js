import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routers/auth.route.js";
import { connectDB } from "./lib/db.js";
import socketHandler from "./lib/socket.js";

import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const PORT = process.env.PORT || 8000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/", authRoutes);

socketHandler(io);

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectDB();
});
