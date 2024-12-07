export default class VicinityManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.interactionRange = 2; // Range for Stoonie interactions
        this.combatRange = 3;      // Range for combat interactions
        this.lastUpdateTime = 0;
        this.updateInterval = 500;  // Update every 500ms to avoid too frequent checks
    }

    update(deltaTime) {
        const currentTime = this.gameEngine.age;
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return;
        }
        this.lastUpdateTime = currentTime;

        const entities = Array.from(this.gameEngine.entityManager.entities.values());
        this.checkAllInteractions(entities);
    }

    checkAllInteractions(entities) {
        const stoonies = entities.filter(e => e.constructor.name === 'Stoonie');
        const demons = entities.filter(e => e.constructor.name === 'DemonStoonie');

        // Check Stoonie-Stoonie interactions
        for (let i = 0; i < stoonies.length; i++) {
            const stoonie1 = stoonies[i];
            
            // Skip if dead
            if (stoonie1.isDead()) continue;

            // Check for reproduction with other Stoonies
            for (let j = i + 1; j < stoonies.length; j++) {
                const stoonie2 = stoonies[j];
                if (stoonie2.isDead()) continue;
                
                const distance = stoonie1.position.distanceTo(stoonie2.position);
                if (distance <= this.interactionRange) {
                    this.handleStoonieInteraction(stoonie1, stoonie2);
                }
            }

            // Check for demon encounters
            for (const demon of demons) {
                if (demon.isDead()) continue;
                
                const distance = stoonie1.position.distanceTo(demon.position);
                if (distance <= this.combatRange) {
                    this.handleDemonInteraction(stoonie1, demon);
                }
            }
        }
    }

    handleStoonieInteraction(stoonie1, stoonie2) {
        // Check if they can mate
        if (stoonie1.gender !== stoonie2.gender && 
            !stoonie1.isPregnant && !stoonie2.isPregnant &&
            stoonie1.age - stoonie1.lastMateTime > stoonie1.matingCooldown &&
            stoonie2.age - stoonie2.lastMateTime > stoonie2.matingCooldown) {
            
            // Determine which one gets pregnant (female)
            const femaleStoon = stoonie1.gender === 'female' ? stoonie1 : stoonie2;
            
            console.log(`Stoonies ${stoonie1.id} and ${stoonie2.id} are mating!`);
            femaleStoon.isPregnant = true;
            femaleStoon.pregnancyTime = 0;
            
            // Update mating cooldowns
            stoonie1.lastMateTime = stoonie1.age;
            stoonie2.lastMateTime = stoonie2.age;
        }
    }

    handleDemonInteraction(stoonie, demon) {
        // Update demon's target if it doesn't have one or if this stoonie is closer
        if (!demon.target || 
            demon.position.distanceTo(stoonie.position) < 
            demon.position.distanceTo(demon.target.position)) {
            demon.target = stoonie;
        }

        // If stoonie has combat-capable soul, initiate fight response
        if (stoonie.soul && 
            (stoonie.soul.powers.has('energyBlast') || 
             stoonie.soul.powers.has('shieldBubble'))) {
            stoonie.behaviorState = 'fight';
        } else {
            // Otherwise flee
            stoonie.behaviorState = 'flee';
        }

        // If demon is in attack range, perform attack
        if (demon.position.distanceTo(stoonie.position) <= demon.attackRange) {
            demon.attack(stoonie);
        }
    }
}
