# Dockerfile per frontend Angular statico con nginx
FROM node:20-alpine as build
WORKDIR /app
ARG ANGULAR_BUILD_CONFIGURATION=collaudo
COPY package*.json ./
RUN npm install
COPY ./ ./
RUN npm run build:${ANGULAR_BUILD_CONFIGURATION} --prefix ./

FROM nginx:1.25-alpine
COPY --from=build /app/dist/tenants-app-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint.d/40-env.sh /docker-entrypoint.d/40-env.sh
RUN chmod +x /docker-entrypoint.d/40-env.sh
EXPOSE 80
# Personalizza nginx.conf se necessario
