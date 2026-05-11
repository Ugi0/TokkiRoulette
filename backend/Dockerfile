FROM node:20-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm ci

EXPOSE 8080
CMD ["npm", "run", "dev"]


FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build


FROM node:20-alpine AS prod

WORKDIR /app

COPY package*.json ./
RUN npm i --omit=dev

COPY --from=build /app/dist ./dist

COPY src/resources ./resources

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080
CMD ["node", "dist/server.js"]