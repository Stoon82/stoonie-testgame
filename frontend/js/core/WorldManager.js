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

        // Add random trees and buildings
        const worldSize = 45; // Keep objects within a 90x90 area
        const numTrees = 20;
        const numBuildings = 5;
        const minDistance = 5; // Minimum distance between objects

        // Helper function to get random position
        const getRandomPosition = () => ({
            x: (Math.random() * 2 - 1) * worldSize,
            z: (Math.random() * 2 - 1) * worldSize
        });

        // Helper function to check if position is too close to existing objects
        const isTooClose = (pos) => {
            for (const obj of this.environmentObjects.values()) {
                const dx = obj.mesh.position.x - pos.x;
                const dz = obj.mesh.position.z - pos.z;
                const distSq = dx * dx + dz * dz;
                if (distSq < minDistance * minDistance) {
                    return true;
                }
            }
            return false;
        };

        // Add trees
        for (let i = 0; i < numTrees; i++) {
            let position;
            do {
                position = getRandomPosition();
            } while (isTooClose(position));
            
            this.addTree(position);
        }

        // Add buildings
        for (let i = 0; i < numBuildings; i++) {
            let position;
            do {
                position = getRandomPosition();
            } while (isTooClose(position));
            
            this.addBuilding(position);
        }

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
        const tree = new Tree(this.gameEngine, { x, z });
        const id = this.generateObjectId();
        this.environmentObjects.set(id, tree);
        this.scene.add(tree.mesh);
        return id;
    }

    addBuilding(position) {
        const building = new Building(this.gameEngine, position);
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
