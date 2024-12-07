import * as THREE from 'three';

export default class Tree {
    constructor({ x = 0, z = 0 }) {
        this.position = new THREE.Vector3(x, 0, z);
        this.createModel();
    }

    createModel() {
        // Create a group to hold the tree parts
        this.mesh = new THREE.Group();
        this.mesh.entity = this; // Store reference to entity
        
        // Create trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x4a2810 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1;
        trunk.castShadow = true;
        
        // Create foliage (multiple layers for more realistic look)
        const foliageGeometry = new THREE.ConeGeometry(1.5, 3, 8);
        const foliageMaterial = new THREE.MeshPhongMaterial({ color: 0x0a5a0a });
        
        const foliage1 = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage1.position.y = 3;
        foliage1.castShadow = true;
        
        const foliage2 = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage2.position.y = 2.5;
        foliage2.scale.set(0.8, 0.8, 0.8);
        foliage2.castShadow = true;
        
        // Add all parts to the group
        this.mesh.add(trunk, foliage1, foliage2);
        
        // Position the entire tree
        this.mesh.position.copy(this.position);
    }

    getMesh() {
        return this.mesh;
    }
}
