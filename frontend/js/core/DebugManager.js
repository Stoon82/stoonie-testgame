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
        
        this.init();
    }

    init() {
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
        this.debugOverlay.style.display = 'block';
        this.showDebugObjects();
    }

    deactivate() {
        this.isActive = false;
        this.debugOverlay.style.display = 'none';
        this.hideDebugObjects();
    }

    showDebugObjects() {
        // Show debug visuals for all entities
        this.gameEngine.entityManager.entities.forEach(entity => {
            this.createEntityDebugVisuals(entity);
        });
    }

    hideDebugObjects() {
        // Remove all debug visuals
        this.debugObjects.forEach(obj => {
            if (obj.parent) {
                obj.parent.remove(obj);
            }
        });
        this.debugObjects.clear();
    }

    createEntityDebugVisuals(entity) {
        // Create direction indicator
        const directionArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            entity.position,
            1,
            0xffff00
        );
        entity.mesh.add(directionArrow);
        this.debugObjects.set(entity.id + '_direction', directionArrow);

        // Create velocity vector
        const velocityArrow = new THREE.ArrowHelper(
            entity.velocity.clone().normalize(),
            entity.position,
            entity.velocity.length(),
            0x00ff00
        );
        entity.mesh.add(velocityArrow);
        this.debugObjects.set(entity.id + '_velocity', velocityArrow);

        // Create interaction radius
        const radiusGeometry = new THREE.CircleGeometry(1.5, 32);
        const radiusMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const radiusLine = new THREE.LineLoop(radiusGeometry, radiusMaterial);
        radiusLine.rotation.x = -Math.PI / 2;
        entity.mesh.add(radiusLine);
        this.debugObjects.set(entity.id + '_radius', radiusLine);
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

    getDebugInfo() {
        const entityManager = this.gameEngine.entityManager;
        const entities = Array.from(entityManager.entities.values());
        
        const stoonies = entities.filter(e => e.constructor.name === 'Stoonie');
        const demons = entities.filter(e => e.constructor.name === 'DemonStoonie');
        const males = stoonies.filter(s => s.gender === 'male');
        const females = stoonies.filter(s => s.gender === 'female');
        const pregnant = females.filter(f => f.isPregnant);

        return `
            <div style="color: #00ff00">FPS: ${this.fps}</div>
            <div style="margin-top: 10px; color: #ffffff">Entity Count:</div>
            <div>Total Entities: ${entities.length}</div>
            <div>Stoonies: ${stoonies.length} (♂${males.length} ♀${females.length})</div>
            <div>Pregnant: ${pregnant.length}</div>
            <div>Demons: ${demons.length}</div>
            
            <div style="margin-top: 10px; color: #ffffff">Controls:</div>
            <div>Hold Shift: Show Debug Info</div>
            
            <div style="margin-top: 10px; color: #ffffff">Visual Indicators:</div>
            <div><span style="color: #ffff00">→</span> Entity Direction</div>
            <div><span style="color: #00ff00">→</span> Velocity Vector</div>
            <div><span style="color: #ff0000">○</span> Interaction Radius</div>
        `;
    }

    update() {
        if (!this.isActive) return;

        this.updateFPS();
        this.updateDebugVisuals();
        this.debugOverlay.innerHTML = this.getDebugInfo();
    }
}
