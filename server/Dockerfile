FROM node:18.14.2-alpine

WORKDIR /server
COPY package*.json /server/

ARG NODE_AUTH_TOKEN
RUN npm config set @coinspace:registry https://npm.pkg.github.com \
  && npm config set "//npm.pkg.github.com/:_authToken" '${NODE_AUTH_TOKEN}' \
  && npm i --production \
  && npm config delete "//npm.pkg.github.com/:_authToken"

COPY . ./

CMD ["npm", "run", "server"]
