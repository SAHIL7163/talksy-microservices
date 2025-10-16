
import {subscriber } from "./pubsub.js";

export default function socketHandler(io) {
  // Subscriber: listen to all chat channels
  subscriber.pSubscribe("chat:*", (message, channel) => {
    try {
      const channelId = channel.split(":")[1]; // e.g. roomId OR "global"
      const event = JSON.parse(message);

      if (channelId === "global") {
        // Broadcast to all connected sockets
        io.emit(event.type, event.payload);
      } else {
        // Broadcast only to the specific room
        io.to(channelId).emit(event.type, event.payload);
      }
    } catch (err) {
      console.error("Invalid message from Redis:", message, err);
    }
  });
}
