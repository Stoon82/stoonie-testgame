# Stoonie Game Development Instructions

## Project Structure

### Core Modules (`frontend/js/core/`)
- **GameEngine.js**
  - Main game loop management
  - Scene setup and rendering
  - Camera and controls handling
  - Integration of all other managers

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

### Entities (`frontend/js/entities/`)
- **BaseEntity.js**
  - Base class for all game entities
  - Common properties (position, velocity, health)
  - Physics and movement calculations
  - Core entity behaviors
  - Mesh-entity reference system for UI interaction

- **Stoonie.js**
  - Player-controlled entities
  - Gender-specific properties (red=male, blue=female)
  - Mating and reproduction mechanics
  - Energy and health management
  - Hover stats display support

- **DemonStoonie.js**
  - Enemy entities (purple with horns)
  - Attack behaviors
  - Pathfinding and targeting
  - Special abilities
  - Custom stats display

### Environment (`frontend/js/environment/`)
- **Tree.js**
  - Resource objects
  - Visual representation
  - Interaction mechanics

- **Building.js**
  - Shelter/obstacle objects
  - Customizable dimensions
  - Window generation
  - Collision boundaries

## Rules

### Stoonie Rules
1. **Gender & Appearance**
   - Males are red spheres
   - Females are blue spheres
   - Both have the same base capabilities

2. **Life Cycle**
   - Energy decreases over time
   - Health affected by demon attacks
   - Death occurs when health or energy reaches 0

3. **Reproduction**
   - Requires one male and one female
   - Both parents must have >50% energy
   - Mating costs 30 energy points
   - New Stoonie inherits traits from parents

### Game World Rules
1. **Environment**
   - Trees provide resources
   - Buildings offer shelter
   - Ground has friction effect on movement

2. **Combat**
   - DemonStoonies actively hunt regular Stoonies
   - Damage is instant and unavoidable when in range
   - No friendly fire between Stoonies

3. **Performance**
   - Limit entity count based on performance
   - Optimize updates for inactive entities
   - Use spatial partitioning for collision detection

### UI Rules
1. **Entity Interaction**
   - Hover over entities to view stats
   - Stats panel follows cursor with offset
   - Different stats shown for different entity types

2. **Display Format**
   - Stoonie Stats:
     * Gender
     * Health percentage
     * Energy level
     * Age in seconds
   - Demon Stats:
     * Health percentage
     * Energy level
     * Attack damage

3. **Visual Style**
   - Semi-transparent dark background
   - White text for readability
   - Monospace font for stats
   - Smooth follow cursor

## Development Guidelines
1. **Code Structure**
   - Keep modules decoupled
   - Use event system for communication
   - Document all public methods
   - Follow consistent naming conventions

2. **Version Control**
   - Create feature branches
   - Write descriptive commit messages
   - Test before merging to master
   - Keep commits focused and atomic

3. **Testing**
   - Test new features in isolation
   - Verify performance impact
   - Check cross-module interactions
   - Validate edge cases

## Changelog

### Version 0.1.1 (2024-12-06)
- Added UI Manager with entity hover functionality
- Implemented stats display system
- Added entity-mesh reference system
- Updated base entity with UI support
- Fixed THREE.js import issues

### Version 0.1.0 (2024-12-06)
- Initial project setup
- Basic game engine structure
- Entity system implementation
- Simple environment objects
- Male/Female Stoonie differentiation
- Basic DemonStoonie implementation

### Planned Features
- [ ] Advanced pathfinding for entities
- [ ] Resource gathering mechanics
- [ ] Stoonie evolution system
- [ ] Weather effects
- [ ] Day/night cycle
- [ ] Advanced AI behaviors
- [ ] Multiplayer support
- [ ] Save/Load system
- [ ] Interactive UI elements
- [ ] Entity selection system
- [ ] Command interface for Stoonies

## Performance Targets
- 60 FPS with 100+ entities
- < 16ms per frame
- < 100MB memory usage
- Smooth scaling on mobile devices

## Debug Tools (Planned)
- Entity inspector
- Performance monitor
- World state viewer
- AI behavior debugger
- UI element inspector