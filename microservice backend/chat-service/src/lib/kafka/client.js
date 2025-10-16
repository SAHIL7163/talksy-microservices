import { Kafka } from "kafkajs";
import fs from "fs";
import path from "path";

const kafka = new Kafka({
  clientId: "chat-app-admin",
  brokers: [process.env.KAFKA_BROKER],

  connectionTimeout: 30000, // Increase timeout for cloud
  authenticationTimeout: 30000, // For SASL
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 500, // Faster initial retry
    retries: 10, // More retries than default
    maxRetryTime: 60000, // Cap retry time
    factor: 0.2,
    multiplier: 2,
  },
  ssl: {
    rejectUnauthorized: process.env.NODE_ENV === "production" ? true : false,
    ca: [fs.readFileSync(path.join(process.cwd(), "ca.pem"), "utf-8")], 
  },
  
  sasl: {
    mechanism: "scram-sha-256", 
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  },
});

export { kafka };
