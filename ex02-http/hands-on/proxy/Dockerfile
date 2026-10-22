FROM node:22-alpine
WORKDIR /app
COPY jwt.js server.js ./
USER node
EXPOSE 80
CMD ["node", "server.js"]
