#!/usr/bin/bash

IMAGE_NAME="cezero/dnd-tools-backend"
ENV_FILE="build.env"
VERSION_ARG="$1"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

if [ -n "$VERSION_ARG" ]; then
    VERSION="$VERSION_ARG"
else
    VERSION="${VERSION:-0.1.0}"
    IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"
    PATCH=$((PATCH + 1))
    VERSION="$MAJOR.$MINOR.$PATCH"
fi

echo "VERSION=$VERSION" > "$ENV_FILE"
echo "Using version: $VERSION"

# Build and push the image
docker build -t "${IMAGE_NAME}" -t "${IMAGE_NAME}:${VERSION}" .
docker push "${IMAGE_NAME}:${VERSION}"

# Get the frontend version from its build.env
FRONTEND_VERSION="0.1.0"
if [ -f "../frontend/build.env" ]; then
    source "../frontend/build.env"
    FRONTEND_VERSION="$VERSION"
fi

# Deploy to Kubernetes
echo "Deploying to Kubernetes..."
"../k8s/deploy.sh" "$VERSION" "$FRONTEND_VERSION"
