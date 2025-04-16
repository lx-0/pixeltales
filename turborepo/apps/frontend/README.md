# PixelTales Frontend

A modern web-based game interface built with React, TypeScript, and Phaser.js, featuring real-time character interactions powered by WebSocket communication.

## 🚀 Features

- Real-time character animations and interactions
- WebSocket-based state management
- Responsive game canvas with Phaser.js
- Modern UI components with Radix UI and Tailwind CSS
- Type-safe development with TypeScript
- Hot Module Replacement (HMR) for rapid development

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Game Engine**: Phaser 3
- **State Management**: Redux Toolkit
- **Real-time Communication**: Socket.IO
- **UI Components**: Radix UI, shadcn/ui
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Development Server**: Nginx (production)

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── game/           # Phaser game components
│   │   ├── managers/   # Game state managers
│   │   └── scenes/     # Phaser scenes
│   ├── components/     # React components
│   ├── services/       # Socket and API services
│   ├── store/          # Redux store configuration
│   └── utils/          # Utility functions
├── public/
│   └── assets/        # Game assets (sprites, images)
└── dist/             # Production build output
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Docker (for containerized deployment)

### Development Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. For TypeScript type checking:

   ```bash
   npm run typecheck
   ```

### Docker Development

1. Build the development container:

   ```bash
   docker build -t pixeltales-frontend-dev --target development .
   ```

2. Run the container:

   ```bash
   docker run -p 5173:5173 -v $(pwd):/app pixeltales-frontend-dev
   ```

## 🚀 Deployment

### Production Build

1. Create production build:

   ```bash
   npm run build
   ```

2. Preview the production build:

   ```bash
   npm run preview
   ```

### Docker Production

1. Build the production container:

   ```bash
   docker build -t pixeltales-frontend-prod --target production-runtime .
   ```

2. Run the container:

   ```bash
   docker run -p 80:80 pixeltales-frontend-prod
   ```

## 🔧 Configuration

The application can be configured through environment variables:

- `VITE_BACKEND_URL`: Backend service URL
- `FRONTEND_PORT`: Frontend service port (default: 5173 for dev, 80 for prod)

## 🧪 Development Tools

- ESLint for code linting
- TypeScript for type checking
- Vite for fast development and optimized builds
- Docker for containerized development and deployment

## 📝 Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run typecheck`: Run TypeScript type checking
- `npm run lint`: Run ESLint
- `npm run preview`: Preview production build

## 🔒 Security

- CORS configuration in Nginx
- Security headers for production
- WebSocket secure configuration
- Static asset caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
