# Stage 1: Build dependencies
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --production

# Stage 2: Copy app and run
FROM node:18-slim

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 8080

CMD ["node", "app.js"]