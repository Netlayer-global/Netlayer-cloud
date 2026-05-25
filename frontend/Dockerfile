###############################################################################
# NetLayer Cloud — frontend production image
###############################################################################
# Multi-stage:
#   1. builder → install deps + vite build
#   2. runtime → nginx alpine serving the dist/ folder + reverse-proxying /api
#
# Image size: ~30 MB compressed.
#
# At build time you can override the API URL with --build-arg VITE_API_URL=...
# but the recommended pattern is to deploy frontend behind the same domain
# as backend and rely on nginx's /api proxy below.
###############################################################################

FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
RUN apk add --no-cache curl
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
