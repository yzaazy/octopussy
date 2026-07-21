FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG GIT_SHA=dev
RUN BUILD_DATE="$(date -u +'%Y-%m-%d %H:%M UTC')" GIT_SHA="$GIT_SHA" npm run build

FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
