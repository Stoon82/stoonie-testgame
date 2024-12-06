import * as THREE from 'three';
import BaseEntity from './BaseEntity.js';

export default class DemonStoonie extends BaseEntity {
    constructor(id, config = {}) {
        super(id, config);
        
        this.damage = 20;  // Damage dealt to normal Stoonies
        this.createModel();
        this.createMesh(); // Call createMesh after model creation
    }

    createModel() {
        // Create a more menacing looking sphere for demon stoonies
        const geometry = new THREE.SphereGeometry(0.7, 32, 32);  // Slightly larger
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x800080,  // Purple color for demons
            emissive: 0x400040,  // Slight glow effect
            shininess: 50
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.copy(this.position);
        
        // Add spikes or horns
        this.addHorns();
    }

    addHorns() {
        const hornGeometry = new THREE.ConeGeometry(0.2, 0.5, 8);
        const hornMaterial = new THREE.MeshPhongMaterial({ color: 0x600060 });
        
        // Left horn
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(0.3, 0.5, 0);
        leftHorn.rotation.z = -Math.PI / 6;
        
        // Right horn
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(-0.3, 0.5, 0);
        rightHorn.rotation.z = Math.PI / 6;
        
        this.mesh.add(leftHorn, rightHorn);
    }

    createMesh() {
        // Add implementation for createMesh method
    }

    attack(stoonie) {
        if (this.position.distanceTo(stoonie.position) < 2) {
            stoonie.health -= this.damage;
            return true;
        }
        return false;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Add demon-specific behavior here
        // For example, seeking nearest Stoonie to attack
    }
}
