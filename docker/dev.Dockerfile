FROM node:20-alpine

ENV TZ="Europe/Helsinki"

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
