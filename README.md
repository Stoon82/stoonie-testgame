# Stoonie Game

A Three.js-based game where you manage a population of magical creatures called Stoonies.

## Features

### Core Gameplay
- **Stoonies**: Male (red) and female (blue) creatures that wander, mate, and reproduce
- **Demon Stoonies**: Hostile entities (purple) that chase and attack regular Stoonies
- **Soul System**: Connect souls to Stoonies to grant them special powers and abilities
- **Experience & Leveling**: Souls gain experience through their Stoonie's actions

### Game Mechanics
- **Movement**: Natural wandering behavior with smooth physics
- **Reproduction**: Male and female Stoonies can mate to create offspring
- **Combat**: Demon Stoonies hunt and attack regular Stoonies
- **Soul Powers**: Various abilities unlocked as souls level up

### User Interface
- **Entity Stats**: Hover over entities to see their stats
- **Spawn Controls**: Add new Stoonies and Demons with UI buttons
- **Debug Mode**: Hold Shift to see detailed game information
- **Soul Management**: Track soul levels and powers

## Controls
- **Mouse Hover**: View entity statistics
- **Shift Key**: Toggle debug mode
- **UI Buttons**: 
  - Green: Spawn new Stoonie
  - Red: Spawn new Demon Stoonie

## Soul Powers
- **Level 2**: Speed Boost
- **Level 3**: Healing Aura
- **Level 5**: Shield Bubble
- **Level 7**: Energy Blast
- **Level 10**: Time Warp

## Technical Details
- Built with Three.js
- Modular architecture for easy expansion
- Entity-component system for game objects
- Physics-based movement system
- Event-driven interaction system

## Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Start local server: `npm start`
4. Open browser at `http://localhost:3000`

## Project Structure
```
frontend/
  ├── js/
  │   ├── core/
  │   │   ├── GameEngine.js
  │   │   ├── EntityManager.js
  │   │   ├── WorldManager.js
  │   │   ├── UIManager.js
  │   │   ├── UIOverlay.js
  │   │   ├── DebugManager.js
  │   │   └── SoulManager.js
  │   ├── entities/
  │   │   ├── BaseEntity.js
  │   │   ├── Stoonie.js
  │   │   ├── DemonStoonie.js
  │   │   └── StoonieSoul.js
  │   └── main.js
  └── index.html
```

## Contributing
Feel free to submit issues and pull requests.

## License
MIT License - feel free to use and modify for your own projects.
