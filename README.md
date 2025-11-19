# Microservice Chat App — README

Quick reference for installation, running, and implementation notes for this workspace.

<img width="2207" height="1228" alt="image" src="https://github.com/user-attachments/assets/0da0f80c-4724-4772-a447-120c138b45d3" />

## Frontend

Location: ./frontend

Quick start (local dev)
- Install and run:
  ```sh
  cd frontend
  npm install
  npm run dev
  ```
- Build for production:
  ```sh
  cd frontend
  npm run build
  ```
- Main files:
  - src/main.jsx, src/App.jsx
  - src/components/, src/pages/, src/lib/api.js
- Env: ./frontend/.env (check for API_BASE or similar keys)

## Backend (Microservices)


## Repository layout
- [docker-compose.yml](docker-compose.yml)
- nginx
  - [nginx/Dockerfile](nginx/Dockerfile)
  - [nginx/nginx.conf](nginx/nginx.conf)
- auth-service
  - [.env](auth-service/.env)
  - [Dockerfile](auth-service/Dockerfile)
  - [package.json](auth-service/package.json)
  - [src/server.js](auth-service/src/server.js)
  - [src/controller/auth.controller.js](auth-service/src/controller/auth.controller.js) (`auth.controller`)
  - [src/lib/db.js](auth-service/src/lib/db.js) (`db`)
  - [src/lib/pubsub.js](auth-service/src/lib/pubsub.js) (`pubsub`)
  - [src/lib/socket.js](auth-service/src/lib/socket.js) (`socket`)
  - [src/middleware/auth.middleware.js](auth-service/src/middleware/auth.middleware.js) (`auth.middleware`)
  - [src/models/User.js](auth-service/src/models/User.js) (`User`)
  - [src/routers/auth.route.js](auth-service/src/routers/auth.route.js) (`auth.route`)
- user-service
  - [.env](user-service/.env)
  - [Dockerfile](user-service/Dockerfile)
  - [package.json](user-service/package.json)
  - [src/server.js](user-service/src/server.js)
  - [src/controller/user.controller.js](user-service/src/controller/user.controller.js) (`user.controller`)
  - [src/lib/db.js](user-service/src/lib/db.js) (`db`)
  - [src/lib/pubsub.js](user-service/src/lib/pubsub.js) (`pubsub`)
  - [src/lib/socket.js](user-service/src/lib/socket.js) (`socket`)
  - [src/middleware/auth.middleware.js](user-service/src/middleware/auth.middleware.js) (`auth.middleware`)
  - [src/models/FriendRequest.js](user-service/src/models/FriendRequest.js) (`FriendRequest`)
  - [src/models/User.js](user-service/src/models/User.js) (`User`)
  - [src/routers/user.route.js](user-service/src/routers/user.route.js) (`user.route`)
- chat-service
  - [.env](chat-service/.env)
  - [ca.pem](chat-service/ca.pem)
  - [Dockerfile](chat-service/Dockerfile)
  - [package.json](chat-service/package.json)
  - [src/server.js](chat-service/src/server.js)
  - [src/controller/chat.controller.js](chat-service/src/controller/chat.controller.js) (`chat.controller`)
  - [src/lib/aws.js](chat-service/src/lib/aws.js) (`aws`)
  - [src/lib/db.js](chat-service/src/lib/db.js) (`db`)
  - [src/lib/pubsub.js](chat-service/src/lib/pubsub.js) (`pubsub`)
  - [src/lib/socket.js](chat-service/src/lib/socket.js) (`socket`)
  - [src/lib/kafka/admin.js](chat-service/src/lib/kafka/admin.js) (`kafka.admin`)
  - [src/lib/kafka/client.js](chat-service/src/lib/kafka/client.js) (`kafka.client`)
  - [src/lib/kafka/consumer.js](chat-service/src/lib/kafka/consumer.js) (`kafka.consumer`)
  - [src/lib/kafka/producer.js](chat-service/src/lib/kafka/producer.js) (`kafka.producer`)
  - [src/middleware/auth.middleware.js](chat-service/src/middleware/auth.middleware.js) (`auth.middleware`)
  - [src/models/Message.js](chat-service/src/models/Message.js) (`Message`)
  - [src/models/User.js](chat-service/src/models/User.js) (`User`)
  - [src/routers/chat.route.js](chat-service/src/routers/chat.route.js) (`chat.route`)

## Prerequisites
- Docker & Docker Compose
- Node.js (for local development per-service)
- (Optional) Kafka cluster / AWS credentials if using features in `chat-service`.

## Quick start (Docker Compose)
1. Ensure service `.env` files are filled:
   - [auth-service/.env](auth-service/.env)
   - [user-service/.env](user-service/.env)
   - [chat-service/.env](chat-service/.env)
2. From repo root:
   ```sh
   docker-compose up --build
   ```
3. Check logs or health endpoints. Nginx config is in [nginx/nginx.conf](nginx/nginx.conf) and is wired by [docker-compose.yml](docker-compose.yml).

## Running a single service locally (dev)
Example: run auth-service locally
```sh
cd auth-service
npm install
# start script defined in package.json (e.g. npm start)
npm start
```
- Entrypoints: [auth-service/src/server.js](auth-service/src/server.js)
- Routes: [auth-service/src/routers/auth.route.js](auth-service/src/routers/auth.route.js)
- Controller: [auth-service/src/controller/auth.controller.js](auth-service/src/controller/auth.controller.js)

Same pattern for `user-service` and `chat-service`.

## Environment variables
Each service contains a `.env` with service-specific variables. Typical variables used across services:
- database connection (look at [*/src/lib/db.js](auth-service/src/lib/db.js), [user-service/src/lib/db.js](user-service/src/lib/db.js), [chat-service/src/lib/db.js](chat-service/src/lib/db.js))
- redis/pubsub settings (see [*/src/lib/pubsub.js](auth-service/src/lib/pubsub.js))
- JWT secret and auth configs (see [*/src/middleware/auth.middleware.js](auth-service/src/middleware/auth.middleware.js))
- Kafka brokers for chat (see [chat-service/src/lib/kafka/client.js](chat-service/src/lib/kafka/client.js))
- AWS credentials if using S3 in chat (see [chat-service/src/lib/aws.js](chat-service/src/lib/aws.js))

Open the service `.env` files for required keys:
- [auth-service/.env](auth-service/.env)
- [user-service/.env](user-service/.env)
- [chat-service/.env](chat-service/.env)

## Implementation notes / architecture
- Each service exposes HTTP routes via its [src/server.js](auth-service/src/server.js) and router files (e.g. [`auth.route`](auth-service/src/routers/auth.route.js), [`user.route`](user-service/src/routers/user.route.js), [`chat.route`](chat-service/src/routers/chat.route.js)).
- Controllers handle request logic (e.g. [`auth.controller`](auth-service/src/controller/auth.controller.js), [`user.controller`](user-service/src/controller/user.controller.js), [`chat.controller`](chat-service/src/controller/chat.controller.js)).
- Shared infra per service:
  - Database helpers: [`*/src/lib/db.js`](auth-service/src/lib/db.js), [`user-service/src/lib/db.js`](user-service/src/lib/db.js), [`chat-service/src/lib/db.js`](chat-service/src/lib/db.js)
  - Pub/Sub helpers: [`*/src/lib/pubsub.js`](auth-service/src/lib/pubsub.js)
  - Socket helpers: [`*/src/lib/socket.js`](auth-service/src/lib/socket.js)
- chat-service integrates Kafka:
  - Admin/producer/consumer helpers in [chat-service/src/lib/kafka](chat-service/src/lib/kafka).
  - TLS setup (if required) via [chat-service/ca.pem](chat-service/ca.pem).

Communication patterns:
- REST for CRUD and auth endpoints.
- WebSockets (socket modules) for real-time notifications.
- Pub/Sub (Redis or other) for cross-service event propagation.
- Kafka used in chat-service for scalable message streaming.

## Useful files to inspect
- [docker-compose.yml](docker-compose.yml)
- [nginx/nginx.conf](nginx/nginx.conf)
- Service entry points:
  - [auth-service/src/server.js](auth-service/src/server.js)
  - [user-service/src/server.js](user-service/src/server.js)
  - [chat-service/src/server.js](chat-service/src/server.js)

## Troubleshooting
- Check service logs from Docker Compose:
  ```sh
  docker-compose logs -f
  ```
- Inspect each service's log output and verify env vars are present in container.
- For Kafka issues, verify broker connectivity and CA file at [chat-service/ca.pem](chat-service/ca.pem).
