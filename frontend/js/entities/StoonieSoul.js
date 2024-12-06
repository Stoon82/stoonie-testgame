export class StoonieSoul {
    constructor(id) {
        this.id = id;
        this.level = 1;
        this.experience = 0;
        this.connectedStoonie = null;
        this.powers = new Set();
        this.experienceToNextLevel = this.calculateExperienceForLevel(this.level + 1);
    }

    calculateExperienceForLevel(level) {
        // Experience curve: each level requires more exp than the last
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    addExperience(amount) {
        this.experience += amount;
        while (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.experience -= this.experienceToNextLevel;
        this.experienceToNextLevel = this.calculateExperienceForLevel(this.level + 1);
        this.unlockPowers();
    }

    unlockPowers() {
        // Add powers based on level
        switch(this.level) {
            case 2:
                this.powers.add('speedBoost');
                break;
            case 3:
                this.powers.add('healingAura');
                break;
            case 5:
                this.powers.add('shieldBubble');
                break;
            case 7:
                this.powers.add('energyBlast');
                break;
            case 10:
                this.powers.add('timeWarp');
                break;
        }
    }

    connectToStoonie(stoonie) {
        if (this.connectedStoonie) {
            this.disconnectFromStoonie();
        }
        this.connectedStoonie = stoonie;
        stoonie.soul = this;
        this.applyPowersToStoonie(stoonie);
    }

    disconnectFromStoonie() {
        if (this.connectedStoonie) {
            this.removePowersFromStoonie(this.connectedStoonie);
            this.connectedStoonie.soul = null;
            this.connectedStoonie = null;
        }
    }

    applyPowersToStoonie(stoonie) {
        if (this.powers.has('speedBoost')) {
            stoonie.maxSpeed *= 1.5;
        }
        if (this.powers.has('healingAura')) {
            stoonie.healingFactor = 1.2;
        }
        if (this.powers.has('shieldBubble')) {
            stoonie.shield = 50;
        }
        // Additional powers will be implemented later
    }

    removePowersFromStoonie(stoonie) {
        if (this.powers.has('speedBoost')) {
            stoonie.maxSpeed /= 1.5;
        }
        if (this.powers.has('healingAura')) {
            stoonie.healingFactor = 1.0;
        }
        if (this.powers.has('shieldBubble')) {
            stoonie.shield = 0;
        }
        // Remove other power effects
    }
}
