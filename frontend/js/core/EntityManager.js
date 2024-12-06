import BaseEntity from '../entities/BaseEntity.js';
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

    getHoveredStoonie(mouseEvent) {
        // Convert mouse coordinates to normalized device coordinates (-1 to +1)
        const rect = this.gameEngine.renderer.domElement.getBoundingClientRect();
        const x = ((mouseEvent.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((mouseEvent.clientY - rect.top) / rect.height) * 2 + 1;

        // Update the picking ray with the camera and mouse position
        this.gameEngine.raycaster.setFromCamera({ x, y }, this.gameEngine.camera);

        // Get all Stoonie meshes
        const stoonieObjects = Array.from(this.entities.values())
            .filter(entity => entity instanceof Stoonie)
            .map(stoonie => stoonie.mesh);

        // Check for intersections
        const intersects = this.gameEngine.raycaster.intersectObjects(stoonieObjects);

        if (intersects.length > 0) {
            // Find the corresponding Stoonie entity
            const intersectedMesh = intersects[0].object;
            return Array.from(this.entities.values()).find(entity => 
                entity instanceof Stoonie && entity.mesh === intersectedMesh
            );
        }

        return null;
    }
}
