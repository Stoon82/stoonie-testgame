import * as THREE from 'three';

export default class MapObject {
    constructor(gameEngine, config = {}) {
        this.gameEngine = gameEngine;
        this.id = crypto.randomUUID();
        this.position = new THREE.Vector3(config.x || 0, config.y || 0, config.z || 0);
        this.mesh = null;
        this.isSelected = false;
    }

    getMesh() {
        return this.mesh;
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    createModel() {
        // To be implemented by child classes
        console.warn('createModel() should be implemented by child classes');
    }

    update(deltaTime) {
        // To be implemented by child classes if needed
    }

    toggleSelection() {
        this.isSelected = !this.isSelected;
    }
}
