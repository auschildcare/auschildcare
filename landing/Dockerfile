# Stage 1: build application
FROM node:12-alpine AS build

RUN mkdir /work
WORKDIR /work

# Install & build
COPY . .
RUN yarn install --no-progress
RUN yarn run build
# Remove generated index.html in favor of ssr
RUN rm ./dist/index.html

# production dependencies & server (ssr)
RUN mkdir ./server && \
 cp server.js ./server && \
 cp server-package.json ./server/package.json && \
 cd ./server && \
 yarn install --production --no-progress


# Stage 2: final image
FROM node:12-alpine

RUN mkdir -p /usr/src/app/dist
WORKDIR /usr/src/app

COPY --from=build /work/dist ./dist
COPY --from=build /work/server ./

# Set env vars
ENV NODE_ENV=production

# Start server
CMD ["/bin/sh", "-c", "/usr/local/bin/node server.js"]
