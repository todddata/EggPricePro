# Egg Price Tracker

## Overview

This is a full-stack web application for tracking and comparing cage-free egg prices across different stores. The application allows users to search for egg prices by zip code and radius, view prices on an interactive map, and see price history for individual stores.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **Maps**: Leaflet for interactive maps
- **Charts**: Recharts for price history visualization
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API**: RESTful API endpoints for price data
- **Session Management**: connect-pg-simple for PostgreSQL-based sessions
- **Development**: Vite for build tooling and development server

### Build System
- **Bundler**: Vite for frontend, esbuild for backend
- **Module System**: ESM throughout the application
- **Development**: Hot module replacement in development
- **Production**: Static asset serving with Express

## Key Components

### Data Models
- **Users**: Basic user authentication (id, username, password)
- **Stores**: Store information including name, address, coordinates, and contact details
- **Prices**: Historical price data with store association, egg type, and timestamps

### API Endpoints
- `GET /api/prices` - Search for egg prices by zip code, radius, and egg type
- `GET /api/stores/:id` - Get store details with current prices
- `GET /api/stores/:id/prices` - Get price history for a specific store

### Frontend Pages
- **Home**: Main search interface with map and price table
- **Price History**: Detailed price history charts for individual stores
- **404**: Error page for invalid routes

### Core Features
- **Geographic Search**: Find stores within a specified radius of a zip code
- **Interactive Maps**: Leaflet-based maps showing store locations with price-coded markers
- **Price Comparison**: Side-by-side price comparisons in tabular format
- **Price History**: Historical price tracking with trend visualization
- **Responsive Design**: Mobile-friendly interface with adaptive layouts

## Data Flow

1. **User Search**: Users input zip code, radius, and egg type preferences
2. **Geocoding**: Backend converts zip codes to coordinates (currently using hardcoded mappings)
3. **Store Filtering**: System finds stores within the specified radius
4. **Price Retrieval**: Latest prices are fetched for matching stores
5. **Map Visualization**: Stores are displayed on an interactive map with color-coded price markers
6. **Price History**: Users can view detailed price trends for individual stores

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React, React DOM, React Hook Form
- **UI Libraries**: Radix UI components, Lucide React icons
- **Data Visualization**: Recharts for charts, Leaflet for maps
- **Utilities**: date-fns for date formatting, clsx for class management

### Backend Dependencies
- **Database**: Drizzle ORM, Neon Database serverless driver
- **Server**: Express.js, session management
- **Development**: tsx for TypeScript execution, nodemon-like functionality

### Development Tools
- **Build**: Vite, esbuild, TypeScript
- **Linting/Formatting**: ESLint, Prettier (configured through editor)
- **Database**: Drizzle Kit for migrations and schema management

## Deployment Strategy

### Development
- **Frontend**: Vite development server with HMR
- **Backend**: tsx for TypeScript execution with auto-restart
- **Database**: Neon Database with connection pooling
- **Environment**: Environment variables for database connection

### Production Build
- **Frontend**: Vite builds to `dist/public` directory
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Static Files**: Express serves built frontend assets
- **Database**: PostgreSQL with Drizzle ORM for production scaling

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)
- **Session Configuration**: PostgreSQL-based session storage

### Scaling Considerations
- **Database**: Uses connection pooling through Neon's serverless driver
- **Caching**: TanStack Query provides client-side caching
- **Static Assets**: Vite optimizes and bundles frontend assets
- **API Performance**: Efficient database queries with proper indexing on store coordinates

The application is designed to be deployed on platforms like Replit, Vercel, or traditional hosting with PostgreSQL database support. The serverless database approach allows for easy scaling and reduced operational overhead.