import BaseEntity from '../entities/BaseEntity.js';
import Stoonie from '../entities/Stoonie.js';
import DemonStoonie from '../entities/DemonStoonie.js';

export class EntityManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.scene = gameEngine.scene;
        this.entities = new Map();
        this.nextEntityId = 0;
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;
        console.log('Initializing EntityManager');

        // Create initial entities
        this.createStoonie({ position: { x: 0, y: 0, z: 0 } });
        this.createStoonie({ position: { x: 2, y: 0, z: 2 } });
        this.createStoonie({ position: { x: -2, y: 0, z: -2 } });

        this.initialized = true;
    }

    addEntity(entity) {
        this.entities.set(entity.id, entity);
        this.scene.add(entity.getMesh());
    }

    spawnEntity(type, config = {}) {
        const id = this.nextEntityId++;
        let entity;

        switch(type) {
            case 'Stoonie':
                entity = new Stoonie(id, config, this.gameEngine);
                break;
            case 'DemonStoonie':
                entity = new DemonStoonie(id, config, this.gameEngine);
                break;
            default:
                console.error(`Unknown entity type: ${type}`);
                return null;
        }

        this.addEntity(entity);
        return entity;
    }

    createStoonie(config = {}) {
        return this.spawnEntity('Stoonie', config);
    }

    createDemonStoonie(config = {}) {
        return this.spawnEntity('DemonStoonie', config);
    }

    removeEntity(entity) {
        if (this.entities.has(entity.id)) {
            this.scene.remove(entity.getMesh());
            this.entities.delete(entity.id);
        }
    }

    getEntityById(id) {
        return this.entities.get(id);
    }

    getEntityByMesh(mesh) {
        if (!mesh) return null;
        
        // If the mesh is the entity's main mesh
        for (const entity of this.entities.values()) {
            if (entity.getMesh() === mesh) {
                return entity;
            }
        }

        // If the mesh is a child of the entity's mesh
        let currentMesh = mesh;
        while (currentMesh && currentMesh.parent) {
            for (const entity of this.entities.values()) {
                if (entity.getMesh() === currentMesh) {
                    return entity;
                }
            }
            currentMesh = currentMesh.parent;
        }

        return null;
    }

    getEntities() {
        return Array.from(this.entities.values());
    }

    getEntitiesByType(type) {
        return Array.from(this.entities.values()).filter(entity => entity.constructor.name === type);
    }

    update(deltaTime) {
        if (!this.initialized) return;

        this.entities.forEach(entity => {
            if (entity && entity.update) {
                entity.update(deltaTime);
            }
        });
    }

    getEntitiesInRadius(position, radius, type = null) {
        const entitiesInRadius = [];
        
        this.entities.forEach(entity => {
            if (!type || entity.constructor.name === type) {
                const distance = position.distanceTo(entity.position);
                if (distance <= radius) {
                    entitiesInRadius.push(entity);
                }
            }
        });
        
        return entitiesInRadius;
    }

    getClosestEntity(position, type = null, maxDistance = Infinity) {
        let closest = null;
        let closestDistance = maxDistance;
        
        this.entities.forEach(entity => {
            if (!type || entity.constructor.name === type) {
                const distance = position.distanceTo(entity.position);
                if (distance < closestDistance) {
                    closest = entity;
                    closestDistance = distance;
                }
            }
        });
        
        return closest;
    }

    getHoveredStoonie(mouseEvent) {
        if (!this.gameEngine.raycaster || !this.gameEngine.camera) return null;

        // Calculate normalized device coordinates
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

export default EntityManager;
