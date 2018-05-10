FROM node:6.11.5

WORKDIR /coin
COPY package.json ./package.json

COPY ./app/lib/openalias ./app/lib/openalias
COPY ./app/lib/pin-validator ./app/lib/pin-validator

RUN npm version && \
  npm install --production && \
  npm cache clean

COPY . ./

CMD npm run server
