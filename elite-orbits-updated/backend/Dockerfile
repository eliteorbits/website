FROM node:20-alpine

WORKDIR /app

# python3/make/g++ are needed in case npm has to compile a native module
# (e.g. better-sqlite3) from source instead of using a prebuilt binary —
# Alpine doesn't include these by default.
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Render assigns its own PORT env var at runtime (typically 10000) and
# server.js already reads process.env.PORT, so this is just the fallback
# used for local development outside of Render.
ENV PORT=10000
EXPOSE 10000

CMD ["npm", "start"]
