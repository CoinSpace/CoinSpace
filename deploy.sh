ENV=$1
if [ -z $ENV ]; then ENV=dev; fi
if [ $ENV != "dev" ] && [ $ENV != "prod" ]; then
  echo "Invalid deploy"
  exit 1
fi

echo "=== Docker-machine: $DOCKER_MACHINE_NAME"
echo "=== ENV: $ENV"

rm -rf build
export $(cat .env.$APP) && echo $DB_HOST && npm run build
docker-compose build web
docker-compose -f docker-compose.yml -f docker-compose.$ENV.yml up -d

# Start proxy, if missing
NGINX_PROXY=$(docker ps -fq name=nginx-proxy)
if [ -z $NGINX_PROXY ]; then
  docker-compose -f docker-nginx-proxy.yml up -d
fi