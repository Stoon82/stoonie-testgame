# StoonGame

A unique game where you manage souls and their Stoonie vessels in a dynamic ecosystem. Watch as Stoonies interact, reproduce, and engage in combat with demon variants.

## Features

### Soul System
- Souls can possess Stoonies and grant them special powers
- Powers include Energy Blast, Shield Bubble, and Speed Boost
- Experience system for soul progression

### Entity Types
1. **Stoonies**
   - Can be male or female
   - Can reproduce when conditions are met
   - Show visual indicators for states (pregnancy, soul possession)
   - Have defensive and offensive capabilities
   - Health system with regeneration

2. **Demon Stoonies**
   - Aggressive variants that hunt normal Stoonies
   - Enhanced speed and combat capabilities
   - Strategic targeting system

### Game Mechanics
- **Combat System**
  - Demon Stoonies actively hunt regular Stoonies
  - Stoonies can flee or fight back based on their capabilities
  - Soul powers enhance combat abilities
  - Visual feedback for attacks and damage

- **Reproduction System**
  - Gender-based mating
  - Pregnancy duration with visual indicators
  - Automatic birth process
  - Cooldown period between mating attempts

- **Interaction System**
  - Vicinity-based entity interactions
  - Automatic behavior states (wander, flee, fight)
  - Soul power integration
  - Group dynamics
  - Environment object interaction
  - Hover stats for all interactive elements

- **Environment System**
  - Trees for resource gathering
  - Buildings for shelter
  - Random placement with minimum distance rules
  - Interactive hover information
  - Click-to-interact functionality

### UI Features
- Real-time stats display when hovering over:
  - Stoonies (health, energy, needs, soul status)
  - Trees (location, resource availability)
  - Buildings (location, shelter status)
- Debug mode (Shift key):
  - Entity statistics
  - FPS counter
  - Mouse position tracking
  - Raycast visualization

## Getting Started

1. Clone the repository
2. Open the project in your preferred IDE
3. Start a local server (e.g., using Live Server in VS Code)
4. Open index.html in your browser

## Controls
- **Mouse Controls**
  - Left Click: Select entity or interact with environment
  - Right Click + Drag: Pan camera
  - Scroll Wheel: Zoom in/out
  - Hover: View entity/object information
- **Keyboard Controls**
  - Shift: Toggle debug mode
  - ESC: Clear selection
  - Space: Pause/Resume game

## Development

### Prerequisites
- Modern web browser with WebGL support
- Basic understanding of Three.js
- Local development server

### Project Structure
```
StoonGame_NEW/
├── frontend/
│   ├── js/
│   │   ├── core/         # Core game systems
│   │   ├── entities/     # Entity definitions
│   │   └── utils/        # Utility functions
│   ├── css/             # Styling
│   └── index.html       # Main entry point
└── README.md
```

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.
