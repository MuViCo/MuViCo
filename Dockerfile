FROM registry.access.redhat.com/ubi8/nodejs-18:latest

COPY package.json package-lock.json* ./

RUN \
  if [ -f package-lock.json ]; then npm ci --omit=dev; \
  else npm i --omit=dev; \
  fi

FROM registry.access.redhat.com/ubi8/nodejs-18-minimal:latest

COPY --from=0 /opt/app-root/src/node_modules /opt/app-root/src/node_modules
COPY . /opt/app-root/src
RUN npm run build
RUN rm -rf /opt/app-root/src/client/


EXPOSE 8000

CMD ["npm", "run","prod"]
