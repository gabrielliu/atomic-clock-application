FROM node:23-alpine AS builder

WORKDIR /app

COPY . .
RUN npm install && npm run build

FROM node:23-alpine

WORKDIR /app
# COPY . .
COPY --from=builder /app/build ./build
COPY package*.json .
# RUN npm install --production
RUN npm install --omit=dev

EXPOSE 5173
# CMD [ "npm", "run", "start", "--", "--host", "0.0.0.0"]
CMD ["npx", "serve", "-s", "build", "-l", "5173"]
