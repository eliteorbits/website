FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Render assigns its own PORT env var at runtime (typically 10000) and
# server.js already reads process.env.PORT, so this is just the fallback
# used for local development outside of Render.
ENV PORT=10000
EXPOSE 10000

CMD ["npm", "start"]
