# Dev-образ frontend для docker-compose (исходники монтируются volume-ом, запуск nuxt dev)
FROM node:22-slim

WORKDIR /app

COPY package*.json ./
# postinstall вызывает `nuxt prepare`, которому нужны исходники, поэтому скрипты пропускаем
RUN npm ci --ignore-scripts

COPY . .
RUN npx nuxt prepare

EXPOSE 3000

CMD ["npm", "run", "dev"]
