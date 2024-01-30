FROM docker.io/node:18-alpine

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

COPY package* ./
RUN npm install -g npm@latest

EXPOSE 3000

CMD ["npm", "run", "dev"]
