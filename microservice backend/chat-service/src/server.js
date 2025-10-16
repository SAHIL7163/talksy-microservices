import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";

import chatRoutes from "./routers/chat.route.js";
import { connectDB } from "./lib/db.js";

import { createServer } from "http";
import { Server } from "socket.io";
import socketHandler from "./lib/socket.js";
// import { createTopics } from "./lib/kafka/admin.js";

import { connectProducer } from "./lib/kafka/producer.js";
import { connectConsumer } from "./lib/kafka/consumer.js";

const app = express();
const PORT = process.env.PORT;

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

app.use("/", chatRoutes);

socketHandler(io);

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectDB();
  // createTopics();
  connectProducer();
  connectConsumer();
});
