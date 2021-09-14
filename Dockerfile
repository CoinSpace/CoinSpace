FROM node:14.17.6-alpine

WORKDIR /coin
COPY package*.json /coin/

ARG NODE_AUTH_TOKEN
RUN npm config set @coinspace:registry https://npm.pkg.github.com \
  && npm config set "//npm.pkg.github.com/:_authToken" '${NODE_AUTH_TOKEN}' \
  && npm i --production \
  && npm config delete "//npm.pkg.github.com/:_authToken"

COPY . ./

CMD ["npm", "run", "server"]
