FROM node:6.11.3

WORKDIR /coinspace
COPY package.json ./package.json

COPY ./app/lib/openalias ./app/lib/openalias
COPY ./app/lib/pin-validator ./app/lib/pin-validator
COPY ./app/lib/ticker-api ./app/lib/ticker-api

RUN npm version && \
  npm install --production && \
  npm cache clean

COPY . ./
