# System Architecture

The project consists of a backend service, a frontend web application, a shared data module, and a MySQL database, with Kubernetes manifests for deployment.

## Backend Service
- Built using Node.js and Express
- Provides RESTful APIs for data access and utility functions
- Connects to a MySQL database for data storage
- Organized into features for characters, classes, races, reference tables, skills, and spells
- Utilizes middleware for authentication and authorization

## Middleware
- `requireAuth`: Verifies authentication using JWT tokens
- `requireAdmin`: Checks if the user is an admin
- `requireAuthExcept`: Applies authentication checks except for specific public paths

## Database Schema
- The MySQL database contains multiple tables to store D&D game data.
- The schema for these tables are all stored under @backend/src/db/schema
- Many-to-many relationship tables (e.g., `class_skill_map`, `spell_school_map`)

## Query Execution
- Queries are built dynamically using the `queryBuilder` module
- Queries are executed and timed using the `queryTimer` module
- Transactions are supported through the `runTransactionWith` function

## Frontend Web Application
- Built using Node.js, React, and Tailwind CSS
- Interfaces with the backend service for data retrieval and manipulation
- Uses Vite as the build tool and development server
- Configured to proxy API requests to the backend service during development
- Utilizes React Router DOM for client-side routing
- Implements authentication using React components and context

## Frontend Components
- `Layout`: Defines the basic layout of the application, including a navbar and main content area
- `GenericList`: A reusable list component with filtering, sorting, and column configuration capabilities
  - Used for displaying various types of data, such as characters, spells, and reference tables
- `NavBar`: A navigation bar component with user authentication, edition selection, and links to different parts of the application
- `Markdown`: Components for rendering markdown content

## Frontend Features
- `characters`: Manages character-related data and functionality
- `spells`: Manages spell-related data and functionality
  - Includes components for displaying spell details, editing spells, and listing spells
  - Utilizes configuration files and utility libraries for spell management
- `admin`: Provides administrative features for managing various game data
  - Includes components for admin dashboard, sidebar, and various management features
  - Contains sub-features for managing different types of data (e.g., `classMgmt`, `raceMgmt`, `skillMgmt`)

## Frontend Services
- `LookupService`: Manages lookup data for various entities (classes, spells, races, sources, editions)
- `api`: Handles API requests to the backend service
- `entityResolver`: Resolves entity references in markdown content
- `userProfileService`: Manages user profiles and preferences

## Authentication Implementation
- Uses React context to manage authentication state
- Provides functions for logging in, logging out, and updating user preferences
- Handles token refresh using a timer

## Shared Data Module
- Contains common data structures and utilities used by both backend and frontend

## Deployment
- Kubernetes manifests are provided for deploying the backend and frontend services to a Kubernetes cluster

## Key Technical Decisions
- Separation of concerns between backend and frontend services
- Use of RESTful APIs for communication between frontend and backend
- Utilization of React for building a dynamic and responsive frontend
- MySQL database for storing game-related data

## Component Relationships
- Backend service provides data and utility functions to the frontend application
- Frontend application interacts with the backend service via RESTful APIs
- Shared data module is used by both backend and frontend for common data structures and utilities
- MySQL database stores data used by the backend service

## Backend Routes
- `/auth`: Handles user authentication (registration, login, token refresh)
  - Uses `authController.js` for logic
- `/entity-resolve`: Resolves entities (characters, classes, races) by type and name
- `/characters`: Manages characters (CRUD operations)
  - Uses `charactersController.js` for logic
- `/lookups`: Provides various lookup data (classes, sources, editions, spells, races)
- `/user-profile`: Manages user profiles (get and update)
  - Uses `userProfileController.js` for logic
- `/spells`: Manages spells (CRUD operations)
  - Uses `spellsController.js` for logic

## Frontend Routing
- Uses React Router DOM for client-side routing
- Implements protected routes using authentication context
- Feature routes are aggregated from various feature modules (`characters`, `spells`, `admin`, `skillMgmt`)

## Key Implementation Details
- Character management is handled in `charactersController.js`
  - Supports CRUD operations for characters
  - Uses `timedQuery` from `queryTimer.js` for database interactions
- Spell management is handled in `spellsController.js`
  - Supports CRUD operations for spells

## Key Implementation Details
- Authentication middleware (`requireAuth`, `requireAdmin`, `requireAuthExcept`) protects routes
- Entity resolution uses `entityResolvers` from `resolvers.js`
- Authentication logic is handled in `authController.js`
  - Uses bcrypt for password hashing
  - Uses jsonwebtoken
