# Casino Game Platform - System Architecture

## Overview

This is a full-stack casino game platform built with modern web technologies. The application features a React frontend with TypeScript, an Express.js backend, and uses Drizzle ORM for database operations. It provides a comprehensive casino gaming experience with game management, user statistics, and a responsive design.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom casino theme variables
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful endpoints with JSON responses
- **Error Handling**: Centralized error middleware
- **Development**: Hot module replacement with Vite integration

### Data Storage
- **Primary Database**: PostgreSQL (configured for Neon Database)
- **ORM**: Drizzle ORM with type-safe database queries
- **Schema**: Strongly typed schema definitions with Zod validation
- **Migrations**: Drizzle Kit for database schema management
- **Fallback**: In-memory storage implementation for development

## Key Components

### Database Schema
The application uses four main tables:
- **users**: User accounts with balance and authentication
- **games**: Game catalog with categories, providers, and metadata
- **gameResults**: Game play history and results
- **userStats**: Aggregated user statistics and preferences

### API Endpoints
- `GET /api/games` - Retrieve all games
- `GET /api/games/category/:category` - Filter games by category
- `GET /api/games/featured` - Get featured games
- `GET /api/games/search` - Search games by query
- `POST /api/games/:id/play` - Play a game with bet amount
- `GET /api/user` - Get current user information
- `GET /api/user/stats` - Get user gaming statistics

### Frontend Components
- **CasinoHeader**: Main navigation and user balance display
- **CasinoSidebar**: Category navigation and game filters
- **FeaturedGames**: Showcases promoted games
- **GamesGrid**: Main game catalog with search and filtering
- **GameModal**: Game play interface with betting controls
- **StatsSection**: User statistics dashboard

## Data Flow

1. **User Authentication**: Currently uses a default user system (demo mode)
2. **Game Discovery**: Users browse games through categories or search
3. **Game Play**: Users select bet amounts and play games through modal interface
4. **Result Processing**: Game outcomes are calculated server-side and stored
5. **Statistics Update**: User stats are automatically updated after each game
6. **Balance Management**: Virtual currency system with real-time balance updates

## External Dependencies

### Frontend Dependencies
- **UI Components**: Comprehensive Radix UI component library
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date manipulation
- **Carousel**: Embla Carousel for game showcase
- **Utilities**: clsx and class-variance-authority for styling

### Backend Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm with PostgreSQL dialect
- **Session**: connect-pg-simple for PostgreSQL session storage
- **Validation**: Zod for runtime type checking
- **Development**: tsx for TypeScript execution

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)
- **Session Configuration**: PostgreSQL-backed sessions for production

### Development Workflow
- **Hot Reload**: Vite middleware integrated with Express server
- **Type Safety**: Full TypeScript coverage with strict configuration
- **Code Quality**: ESLint and Prettier configured for consistent formatting

## Changelog

Changelog:
- July 02, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.