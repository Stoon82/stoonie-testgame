import * as THREE from 'three';
import BaseEntity from './BaseEntity.js';

export default class Stoonie extends BaseEntity {
    constructor(id, config = {}) {
        super(id, config);
        
        this.gender = config.gender || (Math.random() > 0.5 ? 'male' : 'female');
        this.createModel();
    }

    createModel() {
        // Create a sphere for the Stoonie
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshPhongMaterial({ 
            color: this.gender === 'male' ? 0xff0000 : 0x0000ff,  // Red for male, Blue for female
            shininess: 30
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.copy(this.position);
    }

    // Stoonie-specific behaviors
    mate(otherStoonie) {
        if (this.gender === otherStoonie.gender) return false;
        if (this.energy < 50 || otherStoonie.energy < 50) return false;
        
        // Mating logic here
        this.energy -= 30;
        otherStoonie.energy -= 30;
        return true;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Add Stoonie-specific update logic here
        // For example, random movement, seeking food, etc.
    }
}
