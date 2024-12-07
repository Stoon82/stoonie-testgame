export default class NeedsManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.entities = new Map(); // Map of entity ID to needs data
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;
        console.log('Initializing NeedsManager');
        this.initialized = true;
    }

    initializeNeeds(entityId) {
        this.entities.set(entityId, {
            hunger: 100,        // 100 = full, 0 = starving
            thirst: 100,       // 100 = hydrated, 0 = dehydrated
            tiredness: 0,      // 0 = well rested, 100 = exhausted
            health: 100,       // 100 = perfect health, 0 = dead
            illnesses: [],     // Array of active illnesses
            pregnancyProgress: 0, // 0 = not pregnant, 100 = ready to give birth
            isPregnant: false
        });
    }

    update(deltaTime) {
        if (!this.initialized) return;

        // Update needs for all entities
        for (const entity of this.gameEngine.entityManager.getEntities()) {
            if (entity.constructor.name === 'Stoonie') {
                this.updateEntityNeeds(entity.id, deltaTime);
            }
        }
    }

    updateEntityNeeds(entityId, deltaTime) {
        const needs = this.entities.get(entityId);
        if (!needs) return;

        // Decrease needs over time
        needs.hunger = Math.max(0, needs.hunger - 0.1 * deltaTime);
        needs.thirst = Math.max(0, needs.thirst - 0.15 * deltaTime);
        needs.tiredness = Math.min(100, needs.tiredness + 0.05 * deltaTime);

        // Update pregnancy progress if pregnant
        if (needs.isPregnant) {
            needs.pregnancyProgress = Math.min(100, needs.pregnancyProgress + 0.2 * deltaTime);
            
            // Check if ready to give birth
            if (needs.pregnancyProgress >= 100) {
                this.giveBirth(entityId);
            }
        }

        // Health effects based on needs
        if (needs.hunger < 20 || needs.thirst < 20 || needs.tiredness > 90) {
            needs.health = Math.max(0, needs.health - 0.1 * deltaTime);
        }

        // Update entity stats
        const entity = this.gameEngine.entityManager.getEntityById(entityId);
        if (entity) {
            entity.health = needs.health;
            entity.needs = {
                hunger: needs.hunger,
                thirst: needs.thirst,
                rest: 100 - needs.tiredness
            };
            entity.isPregnant = needs.isPregnant;
            entity.pregnancyTime = needs.isPregnant ? (100 - needs.pregnancyProgress) : 0;
        }
    }

    startPregnancy(entityId) {
        const needs = this.entities.get(entityId);
        if (needs && !needs.isPregnant) {
            console.log(`Stoonie #${entityId} is now pregnant!`);
            needs.isPregnant = true;
            needs.pregnancyProgress = 0;
        }
    }

    giveBirth(entityId) {
        const entity = this.gameEngine.entityManager.getEntityById(entityId);
        if (entity) {
            console.log(`Stoonie #${entityId} is giving birth!`);
            
            // Create a new Stoonie at a slightly offset position
            const offset = Math.random() * 0.5;
            const position = {
                x: entity.position.x + offset,
                y: entity.position.y,
                z: entity.position.z + offset
            };
            
            this.gameEngine.entityManager.createStoonie({ position });
            
            // Reset pregnancy status
            this.endPregnancy(entityId);
        }
    }

    endPregnancy(entityId) {
        const needs = this.entities.get(entityId);
        if (needs) {
            needs.isPregnant = false;
            needs.pregnancyProgress = 0;
        }
    }

    getNeeds(entityId) {
        return this.entities.get(entityId);
    }

    getStatus(entityId) {
        const needs = this.entities.get(entityId);
        if (!needs) return null;

        return {
            hunger: needs.hunger,
            thirst: needs.thirst,
            tiredness: needs.tiredness,
            health: needs.health,
            isPregnant: needs.isPregnant,
            pregnancyProgress: needs.pregnancyProgress
        };
    }
}
