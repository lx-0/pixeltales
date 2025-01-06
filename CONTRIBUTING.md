# Contributing to PixelTales

Thank you for considering contributing to PixelTales! This document outlines the basics of how to contribute.

## Quick Start

1. Fork and clone the repository
2. Set up development environment:

   ```bash
   cp .env.example .env.development
   # Edit .env.development with your settings
   ```

3. Install dependencies:

   ```bash
   # Backend
   cd backend && poetry install

   # Frontend
   cd frontend && npm install
   ```

4. Start development servers:

   ```bash
   # Backend
   cd backend && poetry run uvicorn app.main:socket_app --reload --port 8000

   # Frontend
   cd frontend && npm run dev
   ```

## Guidelines

### Code Style

- TypeScript: Use strict types, avoid `any`
- Python: Follow PEP 8, use type hints
- Document complex functions
- Write tests for new features

### Git Workflow

1. Create a feature branch
2. Make your changes
3. Write meaningful commit messages
4. Push and create a pull request

### Commit Messages

Format: `<type>: <description>`

Types:
- 🎨 `style`: Code style/format changes
- ✨ `feat`: New feature
- 🐛 `fix`: Bug fix
- 📝 `docs`: Documentation
- ♻️ `refactor`: Code refactoring
- 🧪 `test`: Testing

Example: `feat: Add character mood animations`

## Need Help?

- Open an [issue](https://github.com/lx-0/pixeltales/issues)
- Read the [documentation](docs/)
