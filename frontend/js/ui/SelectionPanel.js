export default class SelectionPanel {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.panel = null;
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;

        // Create the panel container
        this.panel = document.createElement('div');
        this.panel.id = 'selection-panel';
        this.panel.style.cssText = `
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            width: 250px;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            font-family: Arial, sans-serif;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        `;

        // Add to document
        document.body.appendChild(this.panel);
        this.initialized = true;
    }

    update() {
        if (!this.initialized) return;

        const selectedEntities = this.gameEngine.selectionManager.getSelectedEntities();
        
        if (selectedEntities.length === 0) {
            this.panel.style.display = 'none';
            return;
        }

        this.panel.style.display = 'block';

        // Count entities by type
        const counts = {
            total: selectedEntities.length,
            Stoonie: 0,
            Demon: 0,
            Building: 0,
            Tree: 0,
            Other: 0
        };

        selectedEntities.forEach(entity => {
            const type = entity.constructor.name;
            if (counts.hasOwnProperty(type)) {
                counts[type]++;
            } else {
                counts.Other++;
            }
        });

        // Generate HTML content
        let content = '<h2>Selection Info</h2>';

        // If only one entity is selected, show detailed info
        if (selectedEntities.length === 1) {
            const entity = selectedEntities[0];
            content += this.generateDetailedInfo(entity);
        } else {
            // Show summary of selected entities
            content += '<div class="selection-summary">';
            content += `<p>Total Selected: ${counts.total}</p>`;
            for (const [type, count] of Object.entries(counts)) {
                if (type !== 'total' && count > 0) {
                    content += `<p>${type}s: ${count}</p>`;
                }
            }
            content += '</div>';
        }

        this.panel.innerHTML = content;
    }

    generateDetailedInfo(entity) {
        let content = `<div class="entity-details">`;
        content += `<h3>${entity.constructor.name} #${entity.id}</h3>`;

        // Common properties
        if (entity.health !== undefined) {
            content += `<p>Health: ${Math.round(entity.health)}/100</p>`;
        }
        if (entity.energy !== undefined) {
            content += `<p>Energy: ${Math.round(entity.energy)}/100</p>`;
        }

        // Stoonie-specific properties
        if (entity.constructor.name === 'Stoonie') {
            content += `<p>Gender: ${entity.gender}</p>`;
            if (entity.isPregnant) {
                const progress = (entity.pregnancyTime / entity.pregnancyDuration * 100).toFixed(1);
                content += `<p>Pregnancy: ${progress}%</p>`;
            }
            if (entity.soul) {
                content += `<p>Soul Type: ${entity.soul.type}</p>`;
            }
            content += `<p>State: ${entity.behaviorState}</p>`;
        }

        // Demon-specific properties
        if (entity.constructor.name === 'Demon') {
            content += `<p>Attack Damage: ${entity.attackDamage}</p>`;
            content += `<p>State: ${entity.behaviorState}</p>`;
        }

        // Building-specific properties
        if (entity.constructor.name === 'Building') {
            content += `<p>Type: ${entity.buildingType}</p>`;
            if (entity.progress !== undefined) {
                content += `<p>Construction: ${(entity.progress * 100).toFixed(1)}%</p>`;
            }
        }

        content += '</div>';
        return content;
    }

    cleanup() {
        if (this.panel) {
            document.body.removeChild(this.panel);
            this.panel = null;
        }
        this.initialized = false;
    }
}
