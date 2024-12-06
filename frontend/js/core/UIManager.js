import * as THREE from 'three';

export class UIManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredEntity = null;
        this.statsPanel = null;
        
        this.init();
    }

    init() {
        // Create stats panel
        this.createStatsPanel();
        
        // Add event listeners
        window.addEventListener('mousemove', (event) => this.onMouseMove(event), false);
    }

    createStatsPanel() {
        this.statsPanel = document.createElement('div');
        this.statsPanel.id = 'stats-panel';
        this.statsPanel.style.cssText = `
            position: absolute;
            padding: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            pointer-events: none;
            display: none;
            z-index: 1000;
        `;
        document.body.appendChild(this.statsPanel);
    }

    onMouseMove(event) {
        // Update mouse position in normalized device coordinates (-1 to +1)
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Get all meshes in the scene that could be entities
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        // Find the first intersected object that has an associated entity
        let foundEntity = null;
        for (const intersect of intersects) {
            const entity = this.findEntityFromMesh(intersect.object);
            if (entity) {
                foundEntity = entity;
                break;
            }
        }

        // Update hover state
        if (foundEntity !== this.hoveredEntity) {
            this.hoveredEntity = foundEntity;
            this.updateStatsPanel();
        }

        // Update stats panel position if we have a hovered entity
        if (this.hoveredEntity) {
            this.updateStatsPanelPosition(event);
        }
    }

    findEntityFromMesh(mesh) {
        // Traverse up the parent hierarchy to find the entity
        let current = mesh;
        while (current) {
            if (current.entity) {
                return current.entity;
            }
            current = current.parent;
        }
        return null;
    }

    updateStatsPanel() {
        if (!this.hoveredEntity) {
            this.statsPanel.style.display = 'none';
            return;
        }

        const entity = this.hoveredEntity;
        
        // Format stats based on entity type
        let stats = '';
        if (entity.constructor.name === 'Stoonie') {
            stats = `
                <div><strong>Stoonie</strong></div>
                <div>Gender: ${entity.gender}</div>
                <div>Health: ${Math.round(entity.health)}%</div>
                <div>Energy: ${Math.round(entity.energy)}%</div>
                <div>Age: ${Math.round(entity.age)}s</div>
            `;
        } else if (entity.constructor.name === 'DemonStoonie') {
            stats = `
                <div><strong>Demon Stoonie</strong></div>
                <div>Health: ${Math.round(entity.health)}%</div>
                <div>Energy: ${Math.round(entity.energy)}%</div>
                <div>Damage: ${entity.damage}</div>
            `;
        }

        this.statsPanel.innerHTML = stats;
        this.statsPanel.style.display = 'block';
    }

    updateStatsPanelPosition(event) {
        const padding = 15;
        this.statsPanel.style.left = `${event.clientX + padding}px`;
        this.statsPanel.style.top = `${event.clientY + padding}px`;
    }

    update() {
        // Any per-frame UI updates can go here
    }
}
