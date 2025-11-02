# D&D Character Manager

A modern, responsive web application for managing D&D characters built with Nuxt 3, NuxtUI, and TailwindCSS following hexagonal architecture principles.

## 🎯 Features

- **Modern Dashboard**: Clean, intuitive interface with dark mode support
- **Character Management**: Create, edit, and manage D&D characters
- **Real-time Stats**: Track HP, AC, levels, and more
- **Hexagonal Architecture**: Clean, maintainable code structure
- **Type Safety**: Full TypeScript support
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🏗️ Architecture

This project follows hexagonal (ports and adapters) architecture with:

- **Domain Layer**: Core business logic and entities (`server/domain/`)
- **Application Layer**: Use cases and services (`server/application/`)
- **Infrastructure Layer**: Database adapters and external services (`server/infrastructure/`)
- **API Layer**: REST endpoints (`server/api/`)
- **UI Layer**: Vue components and pages (`app/`)

## 📊 Database Schema

The application supports a comprehensive D&D character schema including:

- Character basic info (name, race, class, level, etc.)
- Ability scores and modifiers
- Skills and saving throws
- Spells and spell slots
- Inventory and equipment
- Combat stats and features
- Roleplaying traits and backstory

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd dd
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

## 🛠️ Development

### Project Structure

```
├── app/                    # Frontend application
│   ├── components/         # Vue components
│   ├── pages/             # Route pages
│   └── ...
├── server/                # Backend API
│   ├── api/               # API endpoints
│   ├── application/       # Application services
│   ├── domain/            # Domain entities and repositories
│   └── infrastructure/    # Database and external adapters
├── types/                 # TypeScript type definitions
│   └── dtos/              # Data Transfer Objects
└── ...
```

### Key Components

- **Dashboard** (`/dashboard`): Main character overview and management
- **Character Sheet** (`/characters/[id]`): Detailed character view and editing
- **Character Card**: Reusable component for displaying character summaries
- **Create Character Modal**: Form for creating new characters

### API Endpoints

- `GET /api/characters` - List all characters
- `POST /api/characters` - Create new character
- `GET /api/characters/[id]` - Get character details
- `PUT /api/characters/[id]` - Update character
- `DELETE /api/characters/[id]` - Delete character

## 🎨 UI/UX

Built with:
- **NuxtUI**: Component library with built-in accessibility
- **TailwindCSS**: Utility-first CSS framework
- **Heroicons**: Beautiful, hand-crafted SVG icons
- **Dark Mode**: Automatic system preference detection

## 🔧 Configuration

The application is configured with:
- **Nuxt 3**: Full-stack framework
- **TypeScript**: Type safety throughout
- **ESLint**: Code linting and formatting
- **Auto-imports**: Automatic component and composable imports

## 📝 TODO

To complete the implementation:

1. **Database Integration**: Connect PostgreSQL database
2. **Repository Implementation**: Implement actual database queries
3. **Authentication**: Add user authentication and authorization
4. **Spell Management**: Complete spell and magic system
5. **Dice Rolling**: Add dice rolling functionality
6. **Character Import/Export**: Support for D&D Beyond integration
7. **Campaign Management**: Multi-campaign support
8. **Real-time Updates**: WebSocket support for live sessions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🎲 D&D Integration

This application is designed to support D&D 5th Edition rules and can be extended to support other systems. It includes:

- Standard D&D races, classes, and backgrounds
- Ability score calculations
- Skill proficiency tracking
- Spell slot management
- Hit point and damage tracking
- Experience and leveling system
