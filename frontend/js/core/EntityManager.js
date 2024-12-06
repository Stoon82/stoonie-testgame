import Stoonie from '../entities/Stoonie.js';
import DemonStoonie from '../entities/DemonStoonie.js';

export class EntityManager {
    constructor(scene, gameEngine) {
        this.scene = scene;
        this.gameEngine = gameEngine;
        this.entities = new Map();
        this.nextEntityId = 0;
    }

    addEntity(entity) {
        this.entities.set(entity.id, entity);
        this.scene.add(entity.getMesh());
    }

    createStoonie(config = {}) {
        const stoonie = new Stoonie(this.nextEntityId++, config, this.gameEngine);
        this.addEntity(stoonie);
        
        // Try to connect a soul if available
        this.gameEngine.soulManager.connectSoulToStoonie(stoonie);
        
        return stoonie;
    }

    createDemonStoonie(config = {}) {
        const demon = new DemonStoonie(this.nextEntityId++, config, this.gameEngine);
        this.addEntity(demon);
        return demon;
    }

    removeEntity(entity) {
        this.scene.remove(entity.getMesh());
        this.entities.delete(entity.id);
    }

    update(deltaTime) {
        // Update all entities
        this.entities.forEach(entity => {
            entity.update(deltaTime);
            
            // Check for dead entities
            if (entity.isDead()) {
                if (entity instanceof Stoonie && entity.soul) {
                    // Disconnect soul before removing entity
                    this.gameEngine.soulManager.disconnectSoulFromStoonie(entity);
                }
                this.removeEntity(entity);
            }
        });
    }
}
