# Образ для backend-сервиса TaskFlow (Node.js + Express).
FROM node:20-alpine

WORKDIR /app

# Устанавливаем зависимости отдельно для эффективного кеширования слоёв.
COPY package*.json ./
RUN npm install --omit=dev

# Копируем исходный код.
COPY . .

EXPOSE 4000

CMD ["npm", "start"]
