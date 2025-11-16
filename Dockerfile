# Multi-stage build for Phanta Backend
FROM node:18-alpine AS backend

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ .

EXPOSE 3001

CMD ["node", "server.js"]

