FROM node:12.14.1-alpine

WORKDIR /coin
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

COPY ./app/lib/openalias ./app/lib/openalias
COPY ./app/lib/pin-validator ./app/lib/pin-validator

RUN npm i --production

COPY . ./

CMD ["npm", "run", "server"]
