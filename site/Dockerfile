# Runtime image for awesomedataviz.com: the prebuilt static site plus a
# dependency-free Node server. Build dist/ first (npm run build).
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY package.json ./
COPY server ./server
COPY dist ./dist
USER node
EXPOSE 8080
CMD ["node", "server/server.mjs"]
