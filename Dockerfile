FROM node:0.12.18

WORKDIR /app/user
COPY package.server.json /app/user/package.json
RUN npm version && \
  npm install --production && \
  npm cache clean

COPY . /app/user/
ENV PATH ./node_modules/.bin:$PATH
RUN aperture open
