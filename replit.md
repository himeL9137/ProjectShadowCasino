# Shadow Casino - Casino Gaming Platform

## Overview

Shadow Casino is a full-stack web application offering a comprehensive casino gaming platform. It features real-time interactions, multi-currency support, and administrative capabilities. The platform aims to provide an engaging and robust online gaming experience with a modern UI and a scalable backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI**: Radix UI with Tailwind CSS
- **State Management**: Redux Toolkit for app state, React Query for server state
- **Real-time**: WebSocket client
- **Routing**: React Router

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Authentication**: JWT with HTTP-only cookies, role-based access control
- **Real-time**: WebSocket server
- **Session Management**: Express sessions
- **File Upload**: Multer

### Data Storage
- **Development**: In-memory storage (temporary, resets on restart)
- **Production (Planned)**: PostgreSQL (schemas defined, migration ready)

### Core Features
- **Authentication**: JWT-based with refresh, password hashing, role-based access, IP tracking.
- **Gaming Engine**: Supports multiple game types (Plinko, Number Guessing), biased RNG, real-time balance updates, transaction logging, game history.
- **Multi-Currency System**: Supports 25+ currencies (USD, BDT, INR, BTC, EUR, GBP), real-time exchange rates via external APIs, currency conversion, user-specific preferences.
- **Real-time Features**: WebSocket-based live chat, game notifications, live balance updates, connection management.
- **Administrative Panel**: User management (ban, mute, balance adjustment), transaction monitoring, game settings, advertisement management, multi-currency controls.
- **HTML Game Integration**: Allows custom HTML games to interact with the casino API for bets and balance.
- **Referral Program**: Unique code generation, tracking, earnings dashboard, configurable commission rates and signup bonuses.
- **Payment System**: Comprehensive deposit/withdrawal with 50+ international and local methods, including mobile banking, card payments, and agent banking.
- **Language System**: Multi-language support (20+ languages) with persistent preferences and RTL support.
- **Advertisement System**: Advanced ad blocker bypass with multiple stealthy redirect methods, admin management, and exclusion for specific users.
- **Theming**: Comprehensive theme system with 10+ professional themes, dynamic adaptation, and persistence.
- **Performance Optimizations**: Extensive React optimizations using `React.memo`, `useMemo`, `useCallback`, debouncing, and virtual scrolling.

## External Dependencies

### Core
- **drizzle-orm**: Type-safe ORM (for PostgreSQL migration)
- **jsonwebtoken**: JWT token handling
- **ws**: WebSocket server
- **multer**: File upload
- **axios**: HTTP client

### Frontend
- **@radix-ui/***: UI component primitives
- **@tanstack/react-query**: Server state management
- **@reduxjs/toolkit**: Application state management
- **tailwindcss**: CSS framework
- **p5.js**: Physics engine (for games like Plinko)
- **Tone.js**: Audio system (for games)

### Development Tools
- **tsx**: TypeScript execution
- **esbuild**: JavaScript bundler
- **vite**: Frontend build tool and dev server