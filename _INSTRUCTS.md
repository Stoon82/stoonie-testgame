# Stoonie Game Development Instructions

## Project Structure

### Core Modules (`frontend/js/core/`)
- **GameEngine.js**
  - Main game loop management
  - Scene setup and rendering
  - Camera and controls handling
  - Integration of all managers

- **EntityManager.js**
  - Manages all game entities (Stoonies, DemonStoonies)
  - Entity creation, removal, and lifecycle
  - Entity ID generation and tracking
  - Collision detection and interaction handling

- **WorldManager.js**
  - Environmental object management
  - World generation and updates
  - Terrain and obstacle placement
  - Resource management

- **UIManager.js**
  - Mouse interaction handling
  - Entity hover detection via raycasting
  - Stats panel display and positioning
  - Real-time UI updates

- **UIOverlay.js**
  - Spawn buttons for entities
  - UI element styling and positioning
  - Event handling for UI interactions

- **DebugManager.js**
  - Debug overlay with entity statistics
  - FPS counter and performance monitoring
  - Visual debug indicators
  - Shift key activation system

- **SoulManager.js**
  - Soul pool management
  - Soul-Stoonie connections
  - Experience and leveling system
  - Power unlocking and application

### Entities (`frontend/js/entities/`)
- **BaseEntity.js**
  - Base class for all game entities
  - Common properties (position, velocity, health)
  - Physics and movement calculations
  - Core entity behaviors
  - Mesh-entity reference system

- **Stoonie.js**
  - Gender-specific properties (red=male, blue=female)
  - Mating and reproduction mechanics
  - Energy and health management
  - Soul connection support
  - Power effects implementation

- **DemonStoonie.js**
  - Enemy entities (purple with horns)
  - Attack behaviors and damage dealing
  - Pathfinding and targeting
  - Custom stats display

- **StoonieSoul.js**
  - Level and experience system
  - Power unlocking at specific levels
  - Connection management with Stoonies
  - Power application and removal

## Game Rules

### Stoonie Rules
1. **Gender & Appearance**
   - Males are red spheres
   - Females are blue spheres
   - Both have the same base capabilities

2. **Life Cycle**
   - Energy decreases over time
   - Health affected by demon attacks
   - Death occurs when health or energy reaches 0
   - Death returns soul to pool if connected

3. **Reproduction**
   - Requires one male and one female
   - Both parents must have >50% energy
   - Mating costs 30 energy points
   - New Stoonie inherits traits from parents

### Soul System Rules
1. **Soul Management**
   - Start with 3 souls in pool
   - Souls automatically connect to new Stoonies
   - Souls return to pool when Stoonie dies
   - Each soul levels independently

2. **Experience Gain**
   - Gain XP while pregnant
   - Gain XP for successful mating
   - Experience curves increase with level
   - Powers unlock at specific levels

3. **Soul Powers**
   - Level 2: Speed Boost (50% faster)
   - Level 3: Healing Aura (20% health regen)
   - Level 5: Shield Bubble (50 shield points)
   - Level 7: Energy Blast (unlocked)
   - Level 10: Time Warp (unlocked)

### Game World Rules
1. **Environment**
   - Bounded play area (80x80 units)
   - Entities stay within bounds
   - Smooth physics movement
   - Collision detection between entities

2. **Combat**
   - DemonStoonies actively hunt Stoonies
   - Damage is reduced by shields
   - No friendly fire between Stoonies
   - Visual feedback for damage

### UI Rules
1. **Entity Interaction**
   - Hover over entities to view stats
   - Stats panel follows cursor
   - Different stats for different entities
   - Soul status shown if connected

2. **Debug Mode (Shift Key)**
   - FPS counter
   - Entity population statistics
   - Direction indicators
   - Velocity vectors
   - Interaction radius

3. **Spawn Controls**
   - Green button spawns Stoonie
   - Red button spawns Demon
   - Random spawn position
   - Automatic soul connection

## Development Guidelines
1. **Code Structure**
   - Keep modules decoupled
   - Use event system for communication
   - Document all public methods
   - Follow consistent naming

2. **Performance**
   - Optimize entity updates
   - Use object pooling
   - Limit visual effects
   - Monitor FPS impact

3. **Testing**
   - Test new features in isolation
   - Verify soul system integration
   - Check power effects
   - Validate experience gain

## Changelog

### Version 0.1.3 (2024-12-06)
- Added complete soul system with experience and leveling
- Implemented soul powers and effects
- Added spawn buttons to UI
- Fixed entity movement physics
- Improved debug visualization

### Version 0.1.2 (2024-12-06)
- Added DebugManager with real-time statistics
- Implemented visual debug indicators
- Added FPS counter
- Created shift-key activated debug mode

### Version 0.1.1 (2024-12-06)
- Added UI Manager with hover functionality
- Implemented stats display system
- Added entity-mesh reference system
- Updated base entity with UI support

### Version 0.1.0 (2024-12-06)
- Initial project setup
- Basic game engine structure
- Entity system implementation
- Simple environment objects
- Male/Female Stoonie differentiation

## Future Work
- [ ] Additional soul powers
- [ ] Power visualization effects
- [ ] Soul upgrade system
- [ ] Resource gathering
- [ ] Building construction
- [ ] Weather effects
- [ ] Day/night cycle
- [ ] Advanced AI behaviors
- [ ] Multiplayer support
- [ ] Save/Load system