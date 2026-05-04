#!/bin/bash

# Configuration
IMAGE_NAME="cml-admin-dashboard"
CONTAINER_NAME="cml-dashboard"
PORT=8080

echo "🚀 Starting CML Admin Dashboard Deployment..."

# Check if docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo "❌ Error: docker is not installed." >&2
  exit 1
fi

# Stop and remove existing container if it exists
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "🛑 Stopping and removing existing container..."
    docker stop $CONTAINER_NAME > /dev/null
    docker rm $CONTAINER_NAME > /dev/null
fi

# Build the image
echo "🔨 Building Docker image: $IMAGE_NAME..."
docker build -t $IMAGE_NAME .

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Run the container
echo "🏃 Running container on port $PORT..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:80 \
  --restart unless-stopped \
  $IMAGE_NAME

if [ $? -eq 0 ]; then
    echo "✨ Deployment complete!"
    echo "🌐 Access the dashboard at: http://localhost:$PORT"
else
    echo "❌ Failed to start container!"
    exit 1
fi
