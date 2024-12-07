# Project Requirement Documentation

## Core Modules

### GameEngine.js
- Manages the main game loop
- Handles scene setup and rendering
- Controls camera and user interactions

### MapObject.js
- Base class for all game objects
- Manages ID generation and tracking
- Handles position and selection state

### EntityManager.js
- Manages game entities like Stoonies and DemonStoonies
- Handles entity lifecycle and interactions

### WorldManager.js
- Manages environmental objects and terrain
- Handles world generation and updates
- Creates terrain mesh with proper vertex handling
- Generates terrain textures with gradients and noise
- Supports terrain modification tools (raise, lower, smooth)
- Maintains terrain geometry and material properties

### MapEditManager.js
- Handles terrain modification operations
- Implements height adjustment tools
- Provides smooth terrain transitions
- Manages coordinate transformations
- Updates terrain geometry efficiently

### SelectionManager.js
- Provides a unified selection system for game objects
- Supports multi-select and selection state persistence

### UIManager.js
- Handles mouse interactions and UI updates
- Manages stats panel display

### UIOverlay.js
- Manages UI elements and interactions

### DebugManager.js
- Provides debugging tools and performance monitoring

## Game Features

### Soul System
- Souls possess Stoonies, granting special powers
- Powers include Energy Blast, Shield Bubble, Speed Boost

### Entity Types

#### Stoonies
- Capable of reproduction and combat
- Visual indicators for states like pregnancy

#### Demon Stoonies
- Aggressive variants targeting regular Stoonies

### Game Mechanics

- Object System: Unified base class for game objects
- Combat System: Enhanced combat capabilities with soul powers
- Reproduction System: Gender-based mating and pregnancy indicators
- Interaction System: Vicinity-based interactions and group dynamics
- Terrain System: Dynamic terrain modification with height variations