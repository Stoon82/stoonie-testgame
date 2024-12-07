import * as THREE from 'three';

export default class DebugManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.isActive = false;
        this.debugObjects = new Map();
        this.debugOverlay = null;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.raycastLine = null;
        this.raycastFrameCount = 0;  // Track frames since last raycast
    }

    async initialize() {
        console.log('Initializing DebugManager');
        // Create debug overlay
        this.createDebugOverlay();
        
        // Add keyboard listeners
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Shift') {
                this.activate();
            }
        });

        window.addEventListener('keyup', (event) => {
            if (event.key === 'Shift') {
                this.deactivate();
            }
        });

        return Promise.resolve();
    }

    createDebugOverlay() {
        this.debugOverlay = document.createElement('div');
        this.debugOverlay.id = 'debug-overlay';
        this.debugOverlay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            display: none;
            z-index: 1000;
            min-width: 200px;
            pointer-events: none;
        `;
        document.body.appendChild(this.debugOverlay);
    }

    activate() {
        this.isActive = true;
        if (this.debugOverlay) {
            this.debugOverlay.style.display = 'block';
        }
        this.showDebugObjects();
    }

    deactivate() {
        this.endDebugMode();
    }

    endDebugMode() {
        // Set state to inactive
        this.isActive = false;
        
        // Hide debug overlay
        if (this.debugOverlay) {
            this.debugOverlay.style.display = 'none';
        }

        // Clear all debug visuals
        this.clearAllDebugVisuals();
    }

    clearAllDebugVisuals() {
        // First, remove all tracked debug objects
        this.debugObjects.forEach((object, key) => {
            if (object) {
                // Remove from scene
                if (object.parent) {
                    object.parent.remove(object);
                }
                
                // Dispose of resources
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(mat => {
                            if (mat.map) mat.map.dispose();
                            mat.dispose();
                        });
                    } else {
                        if (object.material.map) object.material.map.dispose();
                        object.material.dispose();
                    }
                }

                // Special cleanup for ArrowHelper
                if (object instanceof THREE.ArrowHelper) {
                    if (object.line) {
                        if (object.line.geometry) object.line.geometry.dispose();
                        if (object.line.material) object.line.material.dispose();
                    }
                    if (object.cone) {
                        if (object.cone.geometry) object.cone.geometry.dispose();
                        if (object.cone.material) object.cone.material.dispose();
                    }
                }
            }
        });
        
        // Clear all tracked objects
        this.debugObjects.clear();
        
        // Clear raycast visualization
        this.clearRaycastVisualization();
        
        // Find and remove any remaining debug objects in the scene
        const objectsToRemove = [];
        this.gameEngine.scene.traverse((object) => {
            if (object.isDebugObject) {
                objectsToRemove.push(object);
            }
        });
        
        // Remove and dispose of found objects
        objectsToRemove.forEach(object => {
            if (object.parent) {
                object.parent.remove(object);
            }
            
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(mat => {
                        if (mat.map) mat.map.dispose();
                        mat.dispose();
                    });
                } else {
                    if (object.material.map) object.material.map.dispose();
                    object.material.dispose();
                }
            }
            
            // Special cleanup for ArrowHelper
            if (object instanceof THREE.ArrowHelper) {
                if (object.line) {
                    if (object.line.geometry) object.line.geometry.dispose();
                    if (object.line.material) object.line.material.dispose();
                }
                if (object.cone) {
                    if (object.cone.geometry) object.cone.geometry.dispose();
                    if (object.cone.material) object.cone.material.dispose();
                }
            }
        });

        // Clean up debug objects attached to Stoonies
        this.gameEngine.entityManager.entities.forEach(entity => {
            if (entity.mesh) {
                entity.mesh.traverse((object) => {
                    if (object.isDebugObject) {
                        if (object.parent) {
                            object.parent.remove(object);
                        }
                        
                        if (object.geometry) {
                            object.geometry.dispose();
                        }
                        if (object.material) {
                            if (Array.isArray(object.material)) {
                                object.material.forEach(mat => {
                                    if (mat.map) mat.map.dispose();
                                    mat.dispose();
                                });
                            } else {
                                if (object.material.map) object.material.map.dispose();
                                object.material.dispose();
                            }
                        }
                        
                        // Special cleanup for ArrowHelper
                        if (object instanceof THREE.ArrowHelper) {
                            if (object.line) {
                                if (object.line.geometry) object.line.geometry.dispose();
                                if (object.line.material) object.line.material.dispose();
                            }
                            if (object.cone) {
                                if (object.cone.geometry) object.cone.geometry.dispose();
                                if (object.cone.material) object.cone.material.dispose();
                            }
                        }
                    }
                });
            }
        });

        // Reset state
        this.raycastLine = null;
        this.raycastFrameCount = 0;
    }

    createEntityDebugVisuals(entity) {
        // Create velocity arrow
        const velocityArrow = new THREE.ArrowHelper(
            entity.velocity.clone().normalize(),
            entity.position,
            entity.velocity.length() * 2,
            0x00ff00
        );
        velocityArrow.isDebugObject = true;
        this.gameEngine.scene.add(velocityArrow);
        this.debugObjects.set(entity.id + '_velocity', velocityArrow);

        // Create direction arrow (red)
        const directionArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, -1), // default direction
            entity.position,
            2, // fixed length
            0xff0000
        );
        directionArrow.isDebugObject = true;
        this.gameEngine.scene.add(directionArrow);
        this.debugObjects.set(entity.id + '_direction', directionArrow);
    }

    showDebugObjects() {
        if (!this.isActive) return;

        // Create debug visuals for each entity
        this.gameEngine.entityManager.entities.forEach(entity => {
            this.createEntityDebugVisuals(entity);
        });
    }

    hideDebugObjects() {
        this.debugObjects.forEach((object) => {
            if (object && object.parent) {
                object.parent.remove(object);
            }
        });
    }

    clearRaycastVisualization() {
        if (this.raycastLine) {
            // Remove from scene if it's there
            if (this.raycastLine.parent) {
                this.raycastLine.parent.remove(this.raycastLine);
            }
            
            // Dispose of geometry and material
            if (this.raycastLine.geometry) {
                this.raycastLine.geometry.dispose();
            }
            if (this.raycastLine.material) {
                if (this.raycastLine.material.map) {
                    this.raycastLine.material.map.dispose();
                }
                this.raycastLine.material.dispose();
            }
            
            // Clear the reference
            this.raycastLine = null;
            this.raycastFrameCount = 0;
        }
    }

    createRaycastLine() {
        // Don't create new raycasts if debug mode is off
        if (!this.isActive) return null;

        const material = new THREE.LineBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.5
        });
        const geometry = new THREE.BufferGeometry();
        const line = new THREE.Line(geometry, material);
        line.isDebugObject = true;  // Mark as debug object for cleanup
        this.gameEngine.scene.add(line);
        this.raycastLine = line;
        return line;
    }

    updateDebugVisuals() {
        this.gameEngine.entityManager.entities.forEach(entity => {
            // Update velocity arrow
            const velocityArrow = this.debugObjects.get(entity.id + '_velocity');
            if (velocityArrow) {
                velocityArrow.setDirection(entity.velocity.clone().normalize());
                velocityArrow.setLength(entity.velocity.length() * 2);
            }

            // Update direction arrow based on entity type
            const directionArrow = this.debugObjects.get(entity.id + '_direction');
            if (directionArrow) {
                if (entity.constructor.name === 'DemonStoonie' && entity.target) {
                    const direction = new THREE.Vector3()
                        .subVectors(entity.target.position, entity.position)
                        .normalize();
                    directionArrow.setDirection(direction);
                }
            }
        });
    }

    updateRaycastVisualization(start, end) {
        // Only create new raycasts in debug mode
        if (!this.isActive) {
            this.clearRaycastVisualization();
            return;
        }

        if (!this.raycastLine) {
            this.createRaycastLine();
        }

        if (!this.raycastLine) return;

        const points = new Float32Array([
            start.x, start.y, start.z,
            end.x, end.y, end.z
        ]);

        this.raycastLine.geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
        this.raycastLine.geometry.attributes.position.needsUpdate = true;
        this.raycastFrameCount = 1;
    }

    updateFPS() {
        this.frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastTime;

        if (elapsed >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }

    getEntityStats() {
        const entityManager = this.gameEngine.entityManager;
        const entities = Array.from(entityManager.entities.values());
        
        const stoonies = entities.filter(e => e.constructor.name === 'Stoonie');
        const demons = entities.filter(e => e.constructor.name === 'DemonStoonie');
        const males = stoonies.filter(s => s.gender === 'male');
        const females = stoonies.filter(s => s.gender === 'female');
        const pregnant = females.filter(f => f.isPregnant);

        return `
            <div>Total Stoonies: ${stoonies.length}</div>
            <div>Males: ${males.length}</div>
            <div>Females: ${females.length}</div>
            <div>Pregnant: ${pregnant.length}</div>
            <div>Demons: ${demons.length}</div>
        `;
    }

    update(deltaTime) {
        if (this.isActive) {
            // Clear existing debug visuals before updating
            this.clearAllDebugVisuals();
            
            // Create new debug visuals
            this.showDebugObjects();
            
            this.updateFPS();
            this.updateDebugVisuals();
            
            // Get latest mouse position from input manager
            const inputManager = this.gameEngine.inputManager;
            if (!inputManager || !inputManager.initialized) {
                console.warn('Debug: InputManager not available');
                return;
            }
            
            // Force a mouse position update
            inputManager.updateMousePosition();
            
            // Get hovered entity
            const hoveredEntity = inputManager.getEntityUnderMouse();
            
            // Update debug overlay with latest info
            if (this.debugOverlay) {
                const mousePos = inputManager.mousePosition;
                const normalizedPos = inputManager.normalizedMousePosition;
                const clientPos = { x: inputManager.lastClientX, y: inputManager.lastClientY };
                
                let hoveredInfo = 'None';
                if (hoveredEntity) {
                    hoveredInfo = `${hoveredEntity.constructor.name} (ID: ${hoveredEntity.id})`;
                    if (hoveredEntity.constructor.name === 'Stoonie') {
                        hoveredInfo += `\nGender: ${hoveredEntity.gender}`;
                        hoveredInfo += `\nHealth: ${hoveredEntity.health.toFixed(1)}`;
                        if (hoveredEntity.isPregnant) {
                            hoveredInfo += '\nPregnant';
                        }
                    }
                }
                
                this.debugOverlay.innerHTML = `
                    <div style="color: #00ff00">FPS: ${this.fps}</div>
                    <div style="margin-top: 10px; color: #ffffff">Mouse Position:</div>
                    <div>Client: ${Math.round(clientPos.x)}, ${Math.round(clientPos.y)}</div>
                    <div>Canvas: ${Math.round(mousePos.x)}, ${Math.round(mousePos.y)}</div>
                    <div>Normalized: ${normalizedPos.x.toFixed(3)}, ${normalizedPos.y.toFixed(3)}</div>
                    <div style="margin-top: 10px; color: #ffffff">Hovered Entity:</div>
                    <div style="white-space: pre-line">${hoveredInfo}</div>
                    <div style="margin-top: 10px; color: #ffffff">Entity Count:</div>
                    ${this.getEntityStats()}
                `;
            }
        }

        // Always handle raycast cleanup, regardless of debug mode
        if (this.raycastFrameCount > 0) {
            this.raycastFrameCount++;
            if (this.raycastFrameCount > 2) {
                this.clearRaycastVisualization();
            }
        }
    }
}
