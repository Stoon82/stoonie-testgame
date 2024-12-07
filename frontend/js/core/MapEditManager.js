import * as THREE from 'three';

export default class MapEditManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.initialized = false;
        this.isActive = false;
        this.editRadius = 5;
        this.editStrength = 0.5;
        this.editMode = 'raise'; // 'raise', 'lower', 'smooth'
        this.rangeIndicator = null;
        this.mouseWorldPosition = new THREE.Vector3();
    }

    initialize() {
        if (this.initialized) return;
        console.log('Initializing MapEditManager');
        
        this.createRangeIndicator();
        this.initialized = true;
    }

    createRangeIndicator() {
        // Create a ring geometry to show edit radius
        const geometry = new THREE.RingGeometry(this.editRadius - 0.1, this.editRadius, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        this.rangeIndicator = new THREE.Mesh(geometry, material);
        this.rangeIndicator.rotation.x = -Math.PI / 2; // Lay flat
        this.rangeIndicator.visible = false;
        this.gameEngine.scene.add(this.rangeIndicator);
    }

    updateRangeIndicator(mousePosition) {
        if (!this.isActive || !this.rangeIndicator) return;

        // Cast ray to find world position on terrain
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mousePosition, this.gameEngine.camera);
        const intersects = raycaster.intersectObject(this.gameEngine.worldManager.terrain);

        if (intersects.length > 0) {
            this.mouseWorldPosition.copy(intersects[0].point);
            this.rangeIndicator.position.copy(this.mouseWorldPosition);
            this.rangeIndicator.position.y += 0.1; // Slight offset to prevent z-fighting
            this.rangeIndicator.visible = true;
        } else {
            this.rangeIndicator.visible = false;
        }
    }

    setEditMode(mode) {
        this.editMode = mode;
        // Update range indicator color based on mode
        if (this.rangeIndicator) {
            const color = {
                'raise': 0x00ff00,
                'lower': 0xff0000,
                'smooth': 0x0000ff
            }[mode] || 0x00ff00;
            
            this.rangeIndicator.material.color.setHex(color);
        }
    }

    setEditRadius(radius) {
        this.editRadius = Math.max(1, Math.min(20, radius));
        if (this.rangeIndicator) {
            // Update ring geometry
            const newGeometry = new THREE.RingGeometry(this.editRadius - 0.1, this.editRadius, 32);
            this.rangeIndicator.geometry.dispose();
            this.rangeIndicator.geometry = newGeometry;
        }
    }

    toggleEditMode() {
        this.isActive = !this.isActive;
        if (this.rangeIndicator) {
            this.rangeIndicator.visible = this.isActive;
        }
    }

    modifyTerrain(mousePosition, isPressed) {
        if (!this.isActive || !isPressed) return;

        const terrain = this.gameEngine.worldManager.terrain;
        if (!terrain) return;

        // Get world position of mouse
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mousePosition, this.gameEngine.camera);
        const intersects = raycaster.intersectObject(terrain);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            const vertices = terrain.geometry.attributes.position.array;
            const size = Math.sqrt(vertices.length / 3);
            
            // Transform point to terrain's local space
            const localPoint = new THREE.Vector3();
            localPoint.copy(point);
            terrain.worldToLocal(localPoint);
            
            // For each vertex, check if it's within radius and modify height
            for (let i = 0; i < vertices.length; i += 3) {
                const vertexPosition = new THREE.Vector3(
                    vertices[i],     // x
                    vertices[i + 1], // y
                    vertices[i + 2]  // z
                );
                
                const distance = new THREE.Vector2(
                    vertexPosition.x - localPoint.x,
                    vertexPosition.y - localPoint.y
                ).length();
                
                if (distance <= this.editRadius) {
                    const falloff = Math.cos((distance / this.editRadius) * Math.PI * 0.5); // Smoother falloff
                    
                    switch (this.editMode) {
                        case 'raise':
                            vertices[i + 2] += this.editStrength * falloff * 0.5; // Modify Z for height
                            break;
                        case 'lower':
                            vertices[i + 2] -= this.editStrength * falloff * 0.5; // Modify Z for height
                            break;
                        case 'smooth':
                            // Calculate average height of nearby vertices
                            let avgHeight = 0;
                            let count = 0;
                            const searchRadius = 2;
                            
                            const x = Math.floor(i / 3) % size;
                            const z = Math.floor(Math.floor(i / 3) / size);
                            
                            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                                for (let dz = -searchRadius; dz <= searchRadius; dz++) {
                                    const nx = x + dx;
                                    const nz = z + dz;
                                    
                                    if (nx >= 0 && nx < size && nz >= 0 && nz < size) {
                                        const idx = (nz * size + nx) * 3;
                                        avgHeight += vertices[idx + 2]; // Get Z height
                                        count++;
                                    }
                                }
                            }
                            
                            if (count > 0) {
                                avgHeight /= count;
                                vertices[i + 2] += (avgHeight - vertices[i + 2]) * this.editStrength * falloff * 0.5;
                            }
                            break;
                    }
                }
            }
            
            // Update geometry through WorldManager
            this.gameEngine.worldManager.updateTerrainGeometry();
        }
    }

    cleanup() {
        if (this.rangeIndicator) {
            this.rangeIndicator.geometry.dispose();
            this.rangeIndicator.material.dispose();
            this.gameEngine.scene.remove(this.rangeIndicator);
        }
    }
}
