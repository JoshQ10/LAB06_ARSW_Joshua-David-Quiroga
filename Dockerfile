# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Las variables VITE_* se resuelven en tiempo de build
ARG VITE_USE_MOCK=false
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_AUTH_URL=/auth/login
ARG VITE_IO_BASE=http://localhost:3001
ARG VITE_STOMP_BASE=http://localhost:8081
ENV VITE_USE_MOCK=$VITE_USE_MOCK \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_AUTH_URL=$VITE_AUTH_URL \
    VITE_IO_BASE=$VITE_IO_BASE \
    VITE_STOMP_BASE=$VITE_STOMP_BASE
RUN npm run build

# ---- Runtime: nginx sirve la SPA y hace proxy de /api y /auth al backend ----
FROM nginx:1.27-alpine
ENV BACKEND_URL=http://backend:8080
# La imagen oficial aplica envsubst a /etc/nginx/templates/*.template al iniciar
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
