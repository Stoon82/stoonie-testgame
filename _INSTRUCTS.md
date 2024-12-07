# Stoonie Game Development Instructions

## Project Structure

### Core Modules (`frontend/js/core/`)
- **GameEngine.js**
  - Main game loop management
  - Scene setup and rendering
  - Camera and controls handling
  - Integration of all managers

- **MapObject.js**
  - Base class for all game objects (entities and environment)
  - Unified ID generation and tracking
  - Position and selection state management
  - Common mesh and model handling

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

- **SelectionManager.js**
  - Unified selection system for all game objects
  - Visual selection indicators (rings)
  - Multi-select support with shift key
  - Selection state persistence
  - **New**: Selection is not cleared when clicking empty space if Ctrl key is held

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
  - Damage cooldown system (0.5s between hits)
  - Automatic death cleanup after 1s delay
  - Physics and movement calculations
  - Core entity behaviors
  - Mesh-entity reference system
  - Damage indicator system

- **Stoonie.js**
  - Gender-specific properties (red=male, blue=female)
  - Mating and reproduction mechanics
  - Energy and health management
  - Soul connection support
  - Power effects implementation

- **DemonStoonie.js**
  - Enemy entities (purple with horns)
  - Area-of-effect attacks with 8-unit range
  - Dynamic damage with random variation
  - Visual feedback during attacks
  - Pathfinding and targeting
  - Custom stats display

- **StoonieSoul.js**
  - Level and experience system
  - Power unlocking at specific levels
  - Connection management with Stoonies
  - Power application and removal

### Environment Objects (`frontend/js/environment/`)
- **Tree.js**
  - Resource gathering points
  - Random placement in world
  - Interactive hover stats
  - Click to gather resources

- **Building.js**
  - Shelter structures
  - Random placement with collision detection
  - Interactive hover stats
  - Click to enter functionality

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

2. **Soul Overview Panel**
   - Located on the left side of the screen
   - Shows total soul count and status
   - Displays individual soul cards
   - Color-coded for connection status
   - Shows experience progress bars
   - Lists unlocked powers
   - Displays connected Stoonie info

3. **Selection System**
   - Click to select single Stoonie
   - Shift+Click for multi-select
   - Selection ring around selected Stoonies
   - Selection panel shows detailed stats
   - Clear selection by clicking empty space

4. **Debug Mode (Shift Key)**
   - FPS counter
   - Entity population statistics
   - Direction indicators
   - Velocity vectors
   - Interaction radius

## Combat System

### Damage Mechanics
1. **Cooldown System**
   - Entities can only take damage every 0.5 seconds
   - Prevents rapid-fire damage from overwhelming entities
   - Gives Stoonies a chance to escape from demons

2. **Death Handling**
   - Entities are removed from scene 1 second after death
   - Death state prevents further damage
   - Visual feedback during death sequence
   - Proper cleanup of all entity resources

3. **Area Attacks**
   - Demons affect all Stoonies within 8 units
   - Base damage with random variation (±20%)
   - Visual feedback during attacks
   - Damage indicators show amount of damage taken

4. **Visual Feedback**
   - Damage numbers appear above damaged entities
   - Selection rings scale with entity size
   - Demons glow red during attacks
   - Death effects visible before cleanup

### Selection System
1. **Selection Rings**
   - Green rings appear around selected entities
   - Ring size scales with entity's bounding sphere
   - Rings float slightly above ground to prevent z-fighting
   - Semi-transparent for better visibility

2. **Multi-Select**
   - Hold Shift to select multiple entities
   - Clear selection by clicking empty space
   - Selected entities show in details panel
   - Selection persists until manually cleared

## UI Components (`frontend/js/ui/`)
- **StatsOverlay.js**
  - Real-time entity information display
  - Shows details for Stoonies, Trees, and Buildings
  - Position tracking for hover placement
  - Context-aware information display
  - Custom styling for each entity type

## Code Standards and Patterns

### Export/Import Standards
- Use default exports for all classes:
```javascript
// Good
export default ClassName;

// Bad
export { ClassName };
```

- Import using default imports:
```javascript
// Good
import ClassName from './ClassName.js';

// Bad
import { ClassName } from './ClassName.js';
```

- Exception: Only use named imports for third-party libraries that require it:
```javascript
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
```

### Class Structure Pattern
Each class should follow this pattern:
```javascript
class ClassName {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.initialized = false;
        // Other initialization
    }

    initialize() {
        if (this.initialized) return;
        console.log('Initializing ClassName');
        
        // Initialization logic
        
        this.initialized = true;
    }

    update(deltaTime) {
        if (!this.initialized) return;
        // Update logic
    }
}
```

### Manager Class Requirements
- All manager classes should take `gameEngine` as their constructor parameter
- Get required references through gameEngine (e.g., `this.scene = gameEngine.scene`)
- Include initialization tracking with `this.initialized`
- Check initialization state in update methods
- Implement proper cleanup in removeEntity methods
- Use Maps for collections that need frequent lookups

### Error Handling Standards
- Check for null/undefined objects before use
- Use proper initialization checks
- Log meaningful error messages
- Handle edge cases in entity interactions
- Implement proper cleanup on entity removal

### Performance Guidelines
- Use Maps for collections that need frequent lookups
- Check initialization state before updates
- Use efficient data structures for spatial queries
- Implement proper cleanup in removeEntity methods
- Update UI elements only when necessary
- Use requestAnimationFrame for smooth animations

## Development Guidelines
### Recent Updates (2024-12-07)

#### MapObject System
- Introduced MapObject as base class for all game objects
- Unified handling of:
  - Unique IDs (using crypto.randomUUID)
  - Position management
  - Selection state
  - Model creation
  - Mesh handling

#### Selection System Improvements
- All game objects (entities, trees, buildings) now selectable
- Consistent selection rings for all objects
- Proper cleanup of selection indicators
- Multi-select support with shift key
- Selection state persists correctly
- Debug logging for selection events

#### Environment Object Enhancements
- Trees and buildings properly inherit from MapObject
- Consistent positioning system for all objects
- Minimum distance rules between objects
- Proper scene integration
- Improved model creation methods

### Combat System
- Implemented area-of-effect damage system for demons
- Added damage cooldown (0.5s) to prevent rapid damage
- Improved death handling with cleanup delay
- Fixed selection rings and scaling
- Enhanced visual feedback for combat

### Reproduction System
- Added pregnancy mechanics
  - Duration: 10 seconds
  - Visual indicator: Pink sphere above pregnant Stoonies
  - Automatic birth process
- Mating requirements:
  - Different genders
  - Neither Stoonie pregnant
  - Both off mating cooldown (5 seconds)

### Entity Management
- New VicinityManager for handling entity interactions
  - Manages combat encounters
  - Controls reproduction events
  - Updates every 500ms for performance
- Enhanced EntityManager with proper entity spawning system
  - Reliable entity creation and tracking
  - Scene management integration
  - Proper cleanup on entity removal

### Soul System
- Improved soul-stoonie connection management
- Added combat-related soul powers:
  - Energy Blast: Double damage
  - Shield Bubble: Damage reduction
  - Speed Boost: 50% faster fleeing

### Environment Object Interaction (2024-12-07)
- Added hover stats for Trees and Buildings
- Implemented random placement system for environment objects
- Enhanced raycasting to detect all interactive objects
- Added visual feedback for interactive elements
- Improved debug mode cleanup and performance
- Reduced console logging for better performance

### UI Enhancements
- Stats overlay now shows:
  - Tree locations and resource availability
  - Building locations and shelter status
  - Stoonie detailed stats (health, energy, needs)
- Added clear visual hierarchy in overlays
- Improved hover detection accuracy
- Added intuitive interaction hints

## Known Issues
- Soul disconnection may cause temporary console errors (handled gracefully)
- Entities might occasionally spawn at the same location

## Next Steps
1. Add visual effects for soul powers
2. Implement group behaviors for Stoonies
3. Add more varied combat strategies
4. Create a proper UI for entity stats

## Changelog

### Version 0.1.5 (2024-12-07)
- Implemented area-of-effect damage system for demons
- Added damage cooldown (0.5s) to prevent rapid damage
- Improved death handling with cleanup delay
- Fixed selection rings and scaling
- Enhanced visual feedback for combat

### Version 0.1.4 (2024-12-07)
- Added comprehensive soul management UI
- Implemented selection system with multi-select
- Added detailed soul statistics panel
- Improved UI organization and positioning
- Enhanced visual feedback for soul-stoonie connections

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