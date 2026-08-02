FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Back4app (and most container platforms) inject the PORT env var at runtime.
# server.js already reads process.env.PORT, so this just documents the default.
ENV PORT=4000
EXPOSE 4000

CMD ["npm", "start"]
