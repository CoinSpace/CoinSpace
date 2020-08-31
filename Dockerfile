FROM node:12.14.1-alpine

WORKDIR /coin
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

RUN npm i --production

COPY . ./

CMD ["npm", "run", "server"]
