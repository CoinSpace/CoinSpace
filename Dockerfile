FROM heroku/cedar:14

# Which version of node?
ENV NODE_ENGINE 0.12.12
# Locate our binaries
ENV PATH /app/heroku/node/bin/:/app/user/node_modules/.bin:$PATH
# Create some needed directories
RUN mkdir -p /app/heroku/node /app/.profile.d
WORKDIR /app/user
# Install node
RUN curl -s https://s3pository.heroku.com/node/v$NODE_ENGINE/node-v$NODE_ENGINE-linux-x64.tar.gz | tar --strip-components=1 -xz -C /app/heroku/node
# Export the node path in .profile.d
RUN echo "export PATH=\"/app/heroku/node/bin:/app/user/node_modules/.bin:\$PATH\"" > /app/.profile.d/nodejs.sh

# Bundle install
COPY package.json /app/user/package.json
RUN npm version && \
  npm install --unsafe-perm --ignore-scripts && \
  npm rebuild && \
  npm cache clean

COPY . /app/user/
RUN aperture open
RUN export $(cat .env) && echo $DB_HOST && npm run build