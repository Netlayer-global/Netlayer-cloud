###############################################################################
# NetLayer Cloud — public website production image
###############################################################################
# Multi-stage:
#   1. builder → install deps + vite build
#   2. runtime → nginx alpine serving the dist/ folder + reverse-proxying /api
#
# Image size: ~25 MB compressed (smaller than dashboard since it has fewer
# deps — no axios refresh logic, no zustand, no recharts, etc.).
#
# In production this is exposed on its own subdomain (e.g. netlayer.com)
# while the dashboard SPA gets app.netlayer.com. Caddy can also serve
# both from the same domain by path; see Caddyfile.
###############################################################################

FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
ARG VITE_API_URL=/api
ARG VITE_SOCKET_URL=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
RUN apk add --no-cache curl
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
