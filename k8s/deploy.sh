#!/usr/bin/bash

# Check if version arguments are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <backend-version> <frontend-version>"
    exit 1
fi

BACKEND_VERSION="$1"
FRONTEND_VERSION="$2"

# Update backend deployment
sed -i "s|image: cezero/dnd-tools-backend:[0-9.]*|image: cezero/dnd-tools-backend:${BACKEND_VERSION}|" backend.yaml

# Update frontend deployment
sed -i "s|image: cezero/dnd-tools-frontend:[0-9.]*|image: cezero/dnd-tools-frontend:${FRONTEND_VERSION}|" frontend.yaml

# Apply the updated manifests
echo "Applying updated Kubernetes manifests..."
kubectl apply -f namespace.yaml
kubectl apply -f db-secret.yaml
kubectl apply -f backend.yaml
kubectl apply -f frontend.yaml
kubectl apply -f services.yaml
kubectl apply -f ingressroute.yaml

echo "Deployment completed successfully!" 