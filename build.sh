#!/usr/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to increment patch version
increment_patch() {
    local version=$1
    IFS='.' read -r MAJOR MINOR PATCH <<< "$version"
    PATCH=$((PATCH + 1))
    echo "$MAJOR.$MINOR.$PATCH"
}

# Check for required tools
if ! command_exists docker; then
    echo "Error: docker is not installed"
    exit 1
fi

if ! command_exists kubectl; then
    echo "Error: kubectl is not installed"
    exit 1
fi

# Check arguments
if [ "$#" -eq 2 ]; then
    echo "Using provided versions:"
    echo "Backend:  $1"
    echo "Frontend: $2"
    BACKEND_VERSION="$1"
    FRONTEND_VERSION="$2"
elif [ "$#" -eq 1 ]; then
    echo "Error: Please provide both backend and frontend versions"
    echo "Usage: $0 <backend-version> <frontend-version>"
    echo "Example: $0 1.0.0 1.0.1"
    exit 1
else
    # Get current versions from build.env files
    BACKEND_VERSION="0.1.0"
    FRONTEND_VERSION="0.1.0"
    
    if [ -f "backend/build.env" ]; then
        source "backend/build.env"
        BACKEND_VERSION="$VERSION"
    fi
    
    if [ -f "frontend/build.env" ]; then
        source "frontend/build.env"
        FRONTEND_VERSION="$VERSION"
    fi
    
    # Increment patch versions
    BACKEND_VERSION=$(increment_patch "$BACKEND_VERSION")
    FRONTEND_VERSION=$(increment_patch "$FRONTEND_VERSION")
    
    echo "Using auto-incremented versions:"
    echo "Backend:  $BACKEND_VERSION"
    echo "Frontend: $FRONTEND_VERSION"
fi

# Build and deploy backend
echo "Building backend..."
cd backend || exit 1
echo "VERSION=$BACKEND_VERSION" > build.env
docker build -t "cezero/dnd-tools-backend" -t "cezero/dnd-tools-backend:${BACKEND_VERSION}" .
docker push "cezero/dnd-tools-backend:${BACKEND_VERSION}"
cd ..

# Build and deploy frontend
echo "Building frontend..."
cd frontend || exit 1
echo "VERSION=$FRONTEND_VERSION" > build.env
docker build -t "cezero/dnd-tools-frontend" -t "cezero/dnd-tools-frontend:${FRONTEND_VERSION}" .
docker push "cezero/dnd-tools-frontend:${FRONTEND_VERSION}"
cd ..

# Deploy to Kubernetes
echo "Deploying to Kubernetes..."
./k8s/deploy.sh "$BACKEND_VERSION" "$FRONTEND_VERSION"

echo "Build and deployment completed successfully!" 