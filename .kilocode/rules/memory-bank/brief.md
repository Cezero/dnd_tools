This project is a suite of Dungeons and Dragons utility applications. There are several distinct but related codebases in subdirectories of this project.
 - backend folder contains a node.js + Express backend service that provides access to a mysql database and utility functions.
 ### Project Structure
 
 The project consists of several key components:
 
 * **Frontend**: The `frontend` folder contains a Node.js application built with React and styled using Tailwind CSS. It interfaces with the backend to provide a user interface for managing D&D games.
 * **Shared Data**: The `shared-data` folder contains a Node.js module that provides common data structures and constants used by both the frontend and backend. This ensures consistency and reduces code duplication.
 * **Kubernetes Deployment**: The `k8s` folder contains Kubernetes manifests for deploying both the backend and frontend services to a Kubernetes cluster. This enables scalable and managed deployment of the application.
 
 ### Key Technologies
 
 * Frontend: Node.js, React, Tailwind CSS
 * Backend: Node.js, Express (implied, not directly mentioned)
 * Shared Data: Node.js module
 * Deployment: Kubernetes
 - util folder contains python scripts used to extract data from official source books for importing into the mysql database.
