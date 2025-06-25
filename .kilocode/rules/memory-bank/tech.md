# Technologies Used

## Backend
- Node.js
- Express
- MySQL

## Frontend
- Node.js
- React
- Vite
- Tailwind CSS
- React Router DOM

## Database
- MySQL: Used for storing game-related data

## Query Building and Execution
- `queryBuilder` module: Dynamically builds SQL queries based on filter configurations and query parameters
- `queryTimer` module: Times the execution of SQL queries and supports transaction management

## Middleware
- `requireAuth`: Verifies authentication using JWT tokens
- `requireAdmin`: Checks if the user is an admin
- `requireAuthExcept`: Applies authentication checks except for specific public paths

## Shared Data Module
- Node.js

## Deployment
- Kubernetes

## Development Tools
- npm (Node Package Manager)

## Technical Constraints
- The backend service is designed to be RESTful
- The frontend application is built using React components and Vite

## Dependencies
- Backend: express, mysql2, sequelize (likely), jsonwebtoken, bcrypt
- Caching: Various cache modules for different entity types (e.g., `classCache`, `raceCache`, `spellCache`)
- Frontend: react, react-dom, tailwindcss, @headlessui/react, @heroicons/react, @lexical/react, @tanstack/react-table, react-router-dom, @uiw/react-md-editor, unified, remark-parse, remark-gfm, rehype-raw, rehype-sanitize

## Frontend Components
- `GenericList`: A reusable list component with filtering, sorting, and column configuration capabilities
  - Includes sub-components: `BooleanInput`, `ColumnConfig`, `Input`, `MultiSelect`, `Select`, `SingleSelect`
- `MarkdownEditor`: A component for editing markdown content
- `ProcessMarkdown`: A component for rendering markdown content to HTML
- `NavBar`: A navigation bar component with user authentication, edition selection, and links to different parts of the application
- `SpellDetail`: A component for displaying spell details
- `SpellEdit`: A component for editing spells
- `SpellList`: A component for listing spells

## Markdown Processing Plugins
- `remarkEntitiesAndEmbeds`: A remark plugin for processing custom entity syntax and embedding tables
- `rehypeResolveEntitiesAndEmbeds`: A rehype plugin for resolving entity links and embedded tables
- `rehypeReplaceVariables`: A rehype plugin for replacing variables in markdown content
- `renderMarkdown`: A function for rendering markdown content to HTML
- `renderMarkdownToHast`: A function for converting markdown to HAST (HTML AST)

## Frontend Services
- `LookupService`: A service for managing lookup data (classes, spells, races, sources, editions)
- `api`: A service for making API requests to the backend
- `entityResolver`: A service for resolving entity references in markdown content
- `userProfileService`: A service for managing user profiles

## Styling
- Tailwind CSS is used for styling the frontend application
- Custom CSS styles are defined in `global.css` and `mdeditor.css` for specific components and layouts

## Tool Usage Patterns
- npm is used for package management in all Node.js projects
- Kubernetes manifests are used for deployment
- Vite is used for building and serving the frontend application
