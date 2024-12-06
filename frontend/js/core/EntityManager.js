import Stoonie from '../entities/Stoonie.js';
import DemonStoonie from '../entities/DemonStoonie.js';

export class EntityManager {
    constructor(scene) {
        this.scene = scene;
        this.entities = new Map();
        this.lastEntityId = 0;
    }

    generateEntityId() {
        return ++this.lastEntityId;
    }

    createStoonie(config) {
        const id = this.generateEntityId();
        const stoonie = new Stoonie(id, config);
        
        // Set up birth callback
        stoonie.onBirth = (position) => {
            this.createStoonie({
                position: position.clone().add(new THREE.Vector3(
                    Math.random() * 2 - 1,
                    0,
                    Math.random() * 2 - 1
                )),
                gender: Math.random() > 0.5 ? 'male' : 'female'
            });
        };
        
        this.entities.set(id, stoonie);
        this.scene.add(stoonie.getMesh());
        return stoonie;
    }

    createDemonStoonie(config) {
        const id = this.generateEntityId();
        const demon = new DemonStoonie(id, config);
        this.entities.set(id, demon);
        this.scene.add(demon.getMesh());
        return demon;
    }

    removeEntity(id) {
        const entity = this.entities.get(id);
        if (entity) {
            this.scene.remove(entity.getMesh());
            this.entities.delete(id);
        }
    }

    update(deltaTime) {
        // Update all entities
        this.entities.forEach(entity => {
            entity.update(deltaTime);
            
            // Check for interactions with other entities
            entity.checkInteractions(Array.from(this.entities.values()));
            
            // Remove dead entities
            if (entity.isDead()) {
                this.removeEntity(entity.id);
            }
        });
    }
}
