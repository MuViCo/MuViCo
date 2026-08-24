FROM node:20-alpine

# Apply any OS security patches Alpine has published since this image tag was
# last rebuilt (e.g. OpenSSL fixes), without waiting on the upstream Docker
# Hub image to catch up.
RUN apk update && apk upgrade --no-cache

# Define build arguments
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_APP_ID

# Set environment variables from build arguments
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

COPY package.json package-lock.json* ./

RUN \
  if [ -f package-lock.json ]; then npm ci --omit=dev; \
  else npm i --omit=dev; \
  fi

COPY . .

RUN npm run build

EXPOSE 8000

CMD ["npm", "run", "prod"]