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

    setPositionOnTerrain(x, y) {
        const raycaster = new THREE.Raycaster();
        const down = new THREE.Vector3(0, -1, 0);
        raycaster.set(new THREE.Vector3(x, 100, y), down);

        const intersects = raycaster.intersectObject(this.gameEngine.worldManager.terrain);

        if (intersects.length > 0) {
            const z = intersects[0].point.y;
            this.setPosition(x, y, z);
        } else {
            console.warn('No intersection with terrain found.');
            this.setPosition(x, y, 0);
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
