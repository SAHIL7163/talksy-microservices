
import { kafka } from "./client.js";

const admin = kafka.admin();

export const createTopics = async () => {
  await admin.connect();

  const topics = await admin.listTopics();
  if (!topics.includes("chat-messages")) {
    await admin.createTopics({
      topics: [{ topic: "chat-messages", numPartitions: 3, replicationFactor: 1 }],
    });
    console.log("Topic created: chat-messages");
  } else {
    console.log("Topic already exists");
  }

  await admin.disconnect();
};

// createTopics();
