FROM node:18-bullseye-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
ENV npm_config_optional=true
RUN rm -f package-lock.json && npm install --include=optional

FROM node:18-bullseye-slim AS build
WORKDIR /app
ARG VITE_API_BASE_URL
ARG VITE_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_KEY=$VITE_API_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
ENV PORT=8080
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
