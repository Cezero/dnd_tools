FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:24-slim
RUN npm install -g serve
COPY --from=build /app/dist ./dist

CMD ["serve", "-s", "dist", "-l", "5173"]
