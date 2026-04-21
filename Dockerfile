FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package*.json ./
# #region agent log
RUN node -e "fetch('http://127.0.0.1:7796/ingest/70178dd3-976c-4e2f-a600-5d69868b9991',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'702d70'},body:JSON.stringify({sessionId:'702d70',runId:'pre-fix',hypothesisId:'H3',location:'Dockerfile:npm-ci-start',message:'Starting npm ci in builder image',data:{baseImage:'node:20-bookworm-slim'},timestamp:Date.now()})}).catch(()=>{});"
# #endregion
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 120000 \
    && for attempt in 1 2 3; do \
        npm ci --no-audit --no-fund && test -x node_modules/.bin/react-scripts && break; \
        echo "npm ci attempt $attempt failed, retrying..."; \
        rm -rf node_modules; \
        if [ "$attempt" = "3" ]; then echo "npm ci failed after 3 attempts"; exit 1; fi; \
      done

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
