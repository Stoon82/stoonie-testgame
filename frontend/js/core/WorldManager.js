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
        this.terrain = null;
        this.mapSize = 100; // Size of the terrain
        this.mapHalfSize = this.mapSize / 2; // Half size for easier bounds checking
    }

    generateObjectId() {
        return ++this.lastObjectId;
    }

    isWithinMapBounds(x, z) {
        return Math.abs(x) <= this.mapHalfSize && Math.abs(z) <= this.mapHalfSize;
    }

    getRandomMapPosition() {
        return {
            x: (Math.random() * 2 - 1) * this.mapHalfSize,
            z: (Math.random() * 2 - 1) * this.mapHalfSize
        };
    }

    clampToMapBounds(position) {
        return {
            x: Math.max(-this.mapHalfSize, Math.min(this.mapHalfSize, position.x)),
            z: Math.max(-this.mapHalfSize, Math.min(this.mapHalfSize, position.z))
        };
    }

    initialize() {
        if (this.initialized) return;
        console.log('Initializing WorldManager');

        this.createTerrain();

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
        const clampedPos = this.clampToMapBounds({ x, z });
        const y = this.getTerrainHeight(clampedPos.x, clampedPos.z);
        const tree = new Tree(this.gameEngine, { x: clampedPos.x, y, z: clampedPos.z });
        const id = this.generateObjectId();
        this.environmentObjects.set(id, tree);
        this.scene.add(tree.mesh);
        return id;
    }

    addBuilding(position) {
        const clampedPos = this.clampToMapBounds(position);
        const y = this.getTerrainHeight(clampedPos.x, clampedPos.z);
        const building = new Building(this.gameEngine, { ...clampedPos, y });
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

    modifyHeight(point, radius, strength) {
        if (!this.terrain) return;

        const geometry = this.terrain.geometry;
        const positions = geometry.attributes.position.array;
        const vertices = geometry.attributes.position.count;

        // Convert world point to local terrain space
        const localPoint = new THREE.Vector3();
        localPoint.copy(point);
        localPoint.applyMatrix4(this.terrain.matrixWorld.invert());

        // Iterate through all vertices
        for (let i = 0; i < vertices; i++) {
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];

            // Calculate distance to modification point
            const dx = x - localPoint.x;
            const dy = y - localPoint.z; // Note: y in local space is z in world space due to rotation
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Apply height modification based on distance
            if (distance < radius) {
                const falloff = 1 - (distance / radius);
                positions[i * 3 + 2] += strength * falloff;
            }
        }

        // Update the geometry
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
    }

    createTerrain() {
        const size = 100;
        const segments = 100;
        
        // Create geometry
        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        
        // Generate texture
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#8B4513');  // Saddle Brown
        gradient.addColorStop(0.5, '#556B2F'); // Dark Olive Green
        gradient.addColorStop(1, '#228B22');   // Forest Green
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add noise to texture
        for (let i = 0; i < 50000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * 2;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.1})`;
            ctx.fill();
        }
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        
        // Create material
        const material = new THREE.MeshPhongMaterial({
            map: texture,
            side: THREE.DoubleSide,
            wireframe: false
        });
        
        // Create mesh
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        this.terrain.receiveShadow = true;
        
        // Add some initial height variations
        const vertices = this.terrain.geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = Math.random() * 2; // Small random height variations
        }
        
        this.terrain.geometry.computeVertexNormals();
        this.terrain.geometry.attributes.position.needsUpdate = true;
        
        this.scene.add(this.terrain);
    }

    updateTerrainGeometry() {
        if (this.terrain) {
            this.terrain.geometry.computeVertexNormals();
            this.terrain.geometry.attributes.position.needsUpdate = true;
        }
    }

    getTerrainHeight(x, z) {
        const raycaster = new THREE.Raycaster();
        const startPoint = new THREE.Vector3(x, 100, z);
        const direction = new THREE.Vector3(0, -1, 0);
        raycaster.set(startPoint, direction);

        const intersects = raycaster.intersectObject(this.terrain);
        if (intersects.length > 0) {
            return intersects[0].point.y;
        }
        return 0;
    }
}
