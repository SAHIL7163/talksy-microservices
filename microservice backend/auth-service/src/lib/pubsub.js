// pubsub.js
import { createClient } from "redis";

const publisher = createClient({ url: process.env.REDIS_URL });
const subscriber = createClient({ url: process.env.REDIS_URL });

publisher.on("error", (err) => console.error("Redis Publisher Error", err));
subscriber.on("error", (err) => console.error("Redis Subscriber Error", err));

await publisher.connect();
await subscriber.connect();

export { publisher, subscriber };
