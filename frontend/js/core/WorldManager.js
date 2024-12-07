import * as THREE from 'three';
import Tree from '../environment/Tree.js';
import Building from '../environment/Building.js';

export default class WorldManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.scene = gameEngine.scene;
        this.environmentObjects = new Map();
        this.lastObjectId = 0;
        this.initialized = false;
    }

    generateObjectId() {
        return ++this.lastObjectId;
    }

    initialize() {
        if (this.initialized) return;
        console.log('Initializing WorldManager');

        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x90EE90,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Add some initial environment objects
        this.addTree({ x: 5, z: 5 });
        this.addTree({ x: -8, z: 3 });
        this.addBuilding({ x: -15, z: -15 });

        this.initialized = true;
    }

    update(deltaTime) {
        // Update environment objects if needed
        for (const [id, object] of this.environmentObjects) {
            if (object && typeof object.update === 'function') {
                object.update(deltaTime);
            }
        }
    }

    addTree({ x, z }) {
        const tree = new Tree({ x, z });
        const id = this.generateObjectId();
        this.environmentObjects.set(id, tree);
        this.scene.add(tree.mesh);
        return id;
    }

    addBuilding(position) {
        const building = new Building(position);
        const id = this.generateObjectId();
        this.environmentObjects.set(id, building);
        this.scene.add(building.mesh);
        return id;
    }

    getObject(id) {
        return this.environmentObjects.get(id);
    }

    removeObject(id) {
        const object = this.environmentObjects.get(id);
        if (object) {
            this.scene.remove(object.mesh);
            this.environmentObjects.delete(id);
        }
    }
}
