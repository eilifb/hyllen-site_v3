FROM node:20-bookworm-slim AS builder
WORKDIR /workspace/app

COPY app/package*.json ./
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 120000 \
    && for attempt in 1 2 3; do \
        npm ci --no-audit --no-fund && test -x node_modules/.bin/vite && break; \
        echo "npm ci attempt $attempt failed, retrying..."; \
        rm -rf node_modules; \
        if [ "$attempt" = "3" ]; then echo "npm ci failed after 3 attempts"; exit 1; fi; \
      done

COPY scripts /workspace/scripts
COPY .version /workspace/.version
COPY app .

# Accept either VITE_APP_VERSION (preferred) or REACT_APP_VERSION (legacy)
# from the docker build args. vite.config.ts honours both.
ARG VITE_APP_VERSION=latest
ARG REACT_APP_VERSION=
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV REACT_APP_VERSION=$REACT_APP_VERSION

RUN npm run build

FROM nginx:1.27-alpine

COPY app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
