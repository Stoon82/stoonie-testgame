class SoulManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.souls = new Map();
        this.availableSouls = [];
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;
        console.log('Initializing SoulManager');
        
        // Create initial souls
        this.createSoul('Wanderer');
        this.createSoul('Seeker');
        this.createSoul('Guardian');
        
        this.initialized = true;
    }

    createSoul(name) {
        const soul = {
            id: Math.random().toString(36).substr(2, 9),
            name: name,
            stoonie: null,
            experience: 0,
            level: 1,
            powers: new Set(),
            update: function(deltaTime) {
                if (this.stoonie && this.stoonie.isActive()) {
                    // Soul-specific updates here
                }
            }
        };
        
        this.souls.set(soul.id, soul);
        this.availableSouls.push(soul);
        console.log(`Created soul: ${soul.name} (${soul.id})`);
        return soul;
    }

    getAvailableSoul() {
        return this.availableSouls.length > 0 ? this.availableSouls[0] : null;
    }

    connectSoulToStoonie(soul, stoonie) {
        if (!soul || !stoonie) {
            console.warn('Cannot connect: soul or stoonie is null');
            return false;
        }

        if (soul.stoonie) {
            console.warn(`Soul ${soul.id} is already connected to a stoonie`);
            return false;
        }

        if (stoonie.soul) {
            console.warn(`Stoonie ${stoonie.id} already has a soul`);
            return false;
        }

        // Remove from available souls
        const index = this.availableSouls.indexOf(soul);
        if (index > -1) {
            this.availableSouls.splice(index, 1);
        }

        // Connect soul and stoonie
        soul.stoonie = stoonie;
        stoonie.soul = soul;

        console.log(`Connected soul ${soul.id} to stoonie ${stoonie.id}`);
        return true;
    }

    disconnectSoulFromStoonie(soul) {
        if (!soul) {
            console.warn('Cannot disconnect: soul is null');
            return;
        }

        const stoonie = soul.stoonie;
        if (!stoonie) {
            console.warn(`Soul ${soul.id} is not connected to any stoonie`);
            return;
        }

        // Disconnect both sides
        soul.stoonie = null;
        stoonie.soul = null;

        // Make soul available again
        if (!this.availableSouls.includes(soul)) {
            this.availableSouls.push(soul);
        }

        console.log(`Disconnected soul ${soul.id} from stoonie`);
    }

    update(deltaTime) {
        if (!this.initialized) return;

        this.souls.forEach(soul => {
            if (soul && soul.stoonie) {
                soul.update(deltaTime);
            }
        });
    }

    addExperience(soul, amount) {
        if (!soul) return;
        
        soul.experience += amount;
        
        // Level up check
        const nextLevel = Math.floor(Math.sqrt(soul.experience / 100)) + 1;
        if (nextLevel > soul.level) {
            soul.level = nextLevel;
            console.log(`Soul ${soul.id} leveled up to ${soul.level}!`);
        }
    }
}

export default SoulManager;
