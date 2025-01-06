# <div align="center">🎮 PixelTales</div>

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100.0-green)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0-blue)](https://reactjs.org/)
[![Phaser](https://img.shields.io/badge/Phaser-3.60-orange)](https://phaser.io/)

**Where AI Characters Tell Their Stories**

[Demo](https://pixeltales.0fo.de) • [Documentation](docs/) • [Contributing](CONTRIBUTING.md)

![PixelTales Demo](docs/assets/demo.png)

</div>

## ✨ What is PixelTales?

PixelTales is an interactive web application where AI characters come to life in a retro pixel art world. Watch as they engage in endless conversations, each with their own unique personality and story to tell.

### 🎯 Key Features

- 🤖 **Living AI Characters** - Characters with distinct personalities engage in natural conversations
- 🎨 **Retro Pixel Art** - Beautiful pixel art scenes bring the world to life
- ⚡ **Real-time Interaction** - Watch conversations unfold in real-time
- 🔄 **Endless Stories** - Characters dynamically create new stories and scenarios
- 🎭 **Multiple Personalities** - Each character powered by different AI models

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/lx-0/pixeltales.git
cd pixeltales

# Set up environment
cp .env.example .env.development
# Edit .env.development and add your OpenAI API key

# Start the application
docker compose up
```

Visit <http://localhost:5173> to see your AI characters in action!

### 🎮 Try the Demo

Want to see it in action first? Check out our [live demo](https://pixeltales.0fo.de)!

## 📖 Documentation

- [Installation Guide](docs/installation.md)
- [Architecture Overview](docs/architecture.md)
- [API Reference](docs/api.md)
- [Contributing Guide](CONTRIBUTING.md)

## 🛠️ Tech Stack

<details>
<summary>Click to expand</summary>

### Frontend

- ⚛️ React 18 with TypeScript
- 🎮 Phaser 3 for game rendering
- 🎨 TailwindCSS for styling
- 🔄 Socket.IO for real-time updates

### Backend

- 🚀 FastAPI for high-performance API
- 🤖 LangChain for AI orchestration
- 📦 Redis for state management
- 🗄️ SQLite/PostgreSQL for persistence

</details>

## 🤝 Contributing

We love contributions! Here's how you can help:

1. 🍴 Fork the repository
2. 🌿 Create your feature branch: `git checkout -b feature/amazing-feature`
3. 💾 Commit your changes: `git commit -m 'Add amazing feature'`
4. 📤 Push to the branch: `git push origin feature/amazing-feature`
5. 🔄 Open a Pull Request

See our [Contributing Guide](CONTRIBUTING.md) for more details.

## 🌟 Show Your Support

Give us a ⭐️ if you like this project! It helps us reach more developers.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for the language models
- Phaser game framework team
- FastAPI and LangChain communities
- All our amazing contributors

---

<div align="center">

**[Website](https://pixeltales.0fo.de)** • **[Documentation](docs/)**

Made with ❤️ by the PixelTales team

</div>
