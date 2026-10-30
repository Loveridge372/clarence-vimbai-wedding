FROM node:24-alpine
WORKDIR /app
COPY package.json server.mjs app.mjs ./
ENV NODE_ENV=production PORT=10000 DATA_DIR=/var/data/wedding
EXPOSE 10000
CMD ["node", "server.mjs"]
