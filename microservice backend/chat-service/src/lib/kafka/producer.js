import { kafka } from "./client.js";

export const producer = kafka.producer();

export const connectProducer = async () => {
    try {
        await producer.connect();
        console.log("Kafka producer connected");
    } catch (err) {
        console.error("Error connecting Kafka producer:", err);
    }
};