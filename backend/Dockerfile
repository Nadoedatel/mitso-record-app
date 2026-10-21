# Dev-образ backend для docker-compose (исходники монтируются volume-ом, запуск в режиме watch)
# slim, а не alpine: bcrypt и Prisma engines нормально работают на glibc, для Prisma нужен openssl
FROM node:26-slim

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npx prisma generate

EXPOSE 8080

CMD ["npm", "run", "start:dev"]
