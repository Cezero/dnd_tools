#!/bin/bash

# Source build.env to get the image version
source /home/countzero/git/dnd_tools/backend/build.env

# Stop and remove any currently running backend container
docker ps -q --filter ancestor=cezero/dnd-tools-backend:${VERSION} | xargs -r docker stop
docker ps -a -q --filter ancestor=cezero/dnd-tools-backend:${VERSION} | xargs -r docker rm

# Run the latest backend image with the proper command line
docker run -d -p 3001:3001 --env-file /home/countzero/git/dnd_tools/backend/db.env cezero/dnd-tools-backend:${VERSION} 