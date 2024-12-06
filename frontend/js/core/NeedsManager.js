class NeedsManager {
    constructor() {
        this.entities = new Map(); // Map of entity ID to needs data
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

    update(entityId, deltaTime) {
        const needs = this.entities.get(entityId);
        if (!needs) return;

        // Decrease needs over time
        needs.hunger = Math.max(0, needs.hunger - 0.1 * deltaTime);
        needs.thirst = Math.max(0, needs.thirst - 0.15 * deltaTime);
        needs.tiredness = Math.min(100, needs.tiredness + 0.05 * deltaTime);

        // Update pregnancy progress if pregnant
        if (needs.isPregnant) {
            needs.pregnancyProgress = Math.min(100, needs.pregnancyProgress + 0.2 * deltaTime);
        }

        // Health effects based on needs
        if (needs.hunger < 20 || needs.thirst < 20 || needs.tiredness > 90) {
            needs.health = Math.max(0, needs.health - 0.1 * deltaTime);
        }

        return this.getStatus(entityId);
    }

    startPregnancy(entityId) {
        const needs = this.entities.get(entityId);
        if (needs) {
            needs.isPregnant = true;
            needs.pregnancyProgress = 0;
        }
    }

    endPregnancy(entityId) {
        const needs = this.entities.get(entityId);
        if (needs) {
            needs.isPregnant = false;
            needs.pregnancyProgress = 0;
        }
    }

    addIllness(entityId, illness) {
        const needs = this.entities.get(entityId);
        if (needs && !needs.illnesses.includes(illness)) {
            needs.illnesses.push(illness);
        }
    }

    removeIllness(entityId, illness) {
        const needs = this.entities.get(entityId);
        if (needs) {
            needs.illnesses = needs.illnesses.filter(i => i !== illness);
        }
    }

    heal(entityId, amount) {
        const needs = this.entities.get(entityId);
        if (needs) {
            needs.health = Math.min(100, needs.health + amount);
        }
    }

    feed(entityId, amount) {
        const needs = this.entities.get(entityId);
        if (needs) {
            needs.hunger = Math.min(100, needs.hunger + amount);
        }
    }

    hydrate(entityId, amount) {
        const needs = this.entities.get(entityId);
        if (needs) {
            needs.thirst = Math.min(100, needs.thirst + amount);
        }
    }

    rest(entityId, amount) {
        const needs = this.entities.get(entityId);
        if (needs) {
            needs.tiredness = Math.max(0, needs.tiredness - amount);
        }
    }

    getStatus(entityId) {
        return this.entities.get(entityId) || null;
    }

    removeEntity(entityId) {
        this.entities.delete(entityId);
    }
}

export default NeedsManager;
