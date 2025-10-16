FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./

RUN npm install

# Copy source code
COPY . .

EXPOSE 3000

# Start the service
CMD ["node", "src/server.js"]