import SelectionPanel from './SelectionPanel.js';

export default class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.selectionPanel = null;
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;

        // Initialize selection panel
        this.selectionPanel = new SelectionPanel(this.gameEngine);
        this.selectionPanel.initialize();

        this.initialized = true;
    }

    update(deltaTime) {
        if (!this.initialized) return;

        // Update selection panel
        this.selectionPanel.update();
    }

    cleanup() {
        if (this.selectionPanel) {
            this.selectionPanel.cleanup();
        }
        this.initialized = false;
    }
}
