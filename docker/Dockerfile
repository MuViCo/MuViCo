FROM node:20-alpine AS build
WORKDIR /app

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

# Full install here: tsc and vite (both devDependencies) build the image in
# this stage. The runtime stage below reinstalls with --omit=dev instead of
# copying node_modules forward, so neither of them ships in the final image.
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else npm i; \
  fi

COPY . .

# Builds dist/ (client, via vite) and server-dist/ (server, via tsc) in parallel.
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./

RUN \
  if [ -f package-lock.json ]; then npm ci --omit=dev; \
  else npm i --omit=dev; \
  fi

COPY --from=build /app/dist ./dist
COPY --from=build /app/server-dist ./server-dist

EXPOSE 8000

CMD ["npm", "run", "prod"]
