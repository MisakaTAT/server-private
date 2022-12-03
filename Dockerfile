FROM node:lts-slim as builder

WORKDIR /usr/src/app

COPY . ./

# generate prisma client

RUN yarn &&\
    rm node_modules -rf &&\
    yarn --prod

##############

FROM node:lts-slim

WORKDIR /usr/src/app

COPY --from=builder . ./

RUN yarn

ENV NODE_ENV=production

ENTRYPOINT [ "node", "--loader=ts-node/esm", "--experimental-specifier-resolution=node", "--enable-source-maps", "lib/main.ts" ]
