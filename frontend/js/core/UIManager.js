import * as THREE from 'three';
import UIOverlay from '../ui/UIOverlay.js';
import DetailsPanel from '../ui/details_panel.js';
import StatsOverlay from '../ui/stats_overlay.js';

export default class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.initialized = false;
        this.canvas = null;
        this.overlay = null;
        this.leftPanel = null;
        this.detailsPanel = null;
        this.statsOverlay = null;
        this.hoveredEntity = null;
        this.panels = {};
        this.draggedSoul = null;
        this.mousePosition = { x: 0, y: 0 };
    }

    initialize() {
        if (this.initialized) return;
        console.log('Initializing UIManager');

        // Create canvas for WebGL rendering
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        document.body.appendChild(this.canvas);

        // Create left selection panel
        this.leftPanel = document.createElement('div');
        this.leftPanel.id = 'selection-info-panel';
        this.leftPanel.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 250px;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            font-family: Arial, sans-serif;
            display: none;
            overflow-y: auto;
            z-index: 1000;
        `;
        document.body.appendChild(this.leftPanel);

        // Create bottom UI overlay container
        this.overlay = document.createElement('div');
        this.overlay.id = 'ui-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 1000;
            display: flex;
            gap: 10px;
            height: fit-content;
        `;
        document.body.appendChild(this.overlay);

        const buttonStyle = `
            padding: 8px 16px;
            font-size: 14px;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
            height: fit-content;
        `;

        // Add Stoonie button
        const addStoonieBtn = document.createElement('button');
        addStoonieBtn.textContent = '+ Add Stoonie';
        addStoonieBtn.style.cssText = buttonStyle + 'background: #4CAF50;';
        addStoonieBtn.addEventListener('mouseover', () => addStoonieBtn.style.background = '#45a049');
        addStoonieBtn.addEventListener('mouseout', () => addStoonieBtn.style.background = '#4CAF50');
        addStoonieBtn.addEventListener('click', () => {
            const randomPosition = this.gameEngine.worldManager.getRandomMapPosition();
            this.gameEngine.entityManager.createStoonie({ position: randomPosition });
        });
        this.overlay.appendChild(addStoonieBtn);

        // Add Demon button
        const addDemonBtn = document.createElement('button');
        addDemonBtn.textContent = '+ Add Demon';
        addDemonBtn.style.cssText = buttonStyle + 'background: #f44336;';
        addDemonBtn.addEventListener('mouseover', () => addDemonBtn.style.background = '#da190b');
        addDemonBtn.addEventListener('mouseout', () => addDemonBtn.style.background = '#f44336');
        addDemonBtn.addEventListener('click', () => {
            const randomPosition = this.gameEngine.worldManager.getRandomMapPosition();
            this.gameEngine.entityManager.createDemonStoonie({ position: randomPosition });
        });
        this.overlay.appendChild(addDemonBtn);

        // Add Tree button
        const addTreeBtn = document.createElement('button');
        addTreeBtn.textContent = '+ Add Tree';
        addTreeBtn.style.cssText = buttonStyle + 'background: #2E7D32;';
        addTreeBtn.addEventListener('mouseover', () => addTreeBtn.style.background = '#1B5E20');
        addTreeBtn.addEventListener('mouseout', () => addTreeBtn.style.background = '#2E7D32');
        addTreeBtn.addEventListener('click', () => {
            const randomPosition = this.gameEngine.worldManager.getRandomMapPosition();
            this.gameEngine.worldManager.addTree(randomPosition);
        });
        this.overlay.appendChild(addTreeBtn);

        // Add Building buttons
        const buildingTypes = [
            { name: 'House', color: '#8B4513' },
            { name: 'Storage', color: '#CD853F' }
        ];

        buildingTypes.forEach(building => {
            const addBuildingBtn = document.createElement('button');
            addBuildingBtn.textContent = `+ Add ${building.name}`;
            addBuildingBtn.style.cssText = buttonStyle + `background: ${building.color};`;
            const darkerColor = this.adjustColor(building.color, -20);
            addBuildingBtn.addEventListener('mouseover', () => addBuildingBtn.style.background = darkerColor);
            addBuildingBtn.addEventListener('mouseout', () => addBuildingBtn.style.background = building.color);
            addBuildingBtn.addEventListener('click', () => {
                const randomPosition = this.gameEngine.worldManager.getRandomMapPosition();
                this.gameEngine.entityManager.createBuilding({
                    type: building.name.toLowerCase(),
                    position: randomPosition
                });
            });
            this.overlay.appendChild(addBuildingBtn);
        });

        // Initialize stats overlay
        this.statsOverlay = new StatsOverlay(this.overlay, this.gameEngine);

        // Initialize details panel
        this.detailsPanel = new DetailsPanel(this.overlay);

        this.initialized = true;
    }

    adjustColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }

    switchTab(tabId) {
        // Update tab button styles
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.toggle('active', button.dataset.tabId === tabId);
        });

        // Show selected content, hide others
        Object.values(this.panels).forEach(panel => {
            panel.style.display = panel.id === `${tabId}-content` ? 'block' : 'none';
        });

        // Refresh content
        this.updateTabContent(tabId);
    }

    updateTabContent(tabId) {
        const panel = this.panels[tabId];
        if (!panel) return;

        switch(tabId) {
            case 'selection':
                this.updateSelectionPanel();
                break;
            case 'souls':
                this.updateSoulsPanel();
                break;
            case 'stoonies':
                this.updateStooniesPanel();
                break;
            case 'buildings':
                this.updateBuildingsPanel();
                break;
        }
    }

    updateSelectionPanel() {
        const panel = this.panels.selection;
        const selection = this.gameEngine.selectionManager.getSelection();
        
        if (selection.length === 0) {
            panel.innerHTML = '<div class="info-message">No units selected</div>';
        } else if (selection.length === 1) {
            panel.innerHTML = this.generateEntityStats(selection[0]);
        } else {
            panel.innerHTML = this.generateGroupSelection(selection);
        }
    }

    updateSoulsPanel() {
        const panel = this.panels.souls;
        const souls = this.gameEngine.entityManager.getEntitiesByType('Soul');
        
        let html = '<div class="souls-list">';
        souls.forEach(soul => {
            html += `
                <div class="soul-item" onclick="this.gameEngine.selectionManager.setSelection([${soul.id}])">
                    <div class="soul-name">${soul.name || 'Unnamed Soul'}</div>
                    <div class="soul-stats">
                        <div>Health: ${soul.health}/${soul.maxHealth}</div>
                        <div>Status: ${soul.status || 'Normal'}</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        panel.innerHTML = html;
    }

    updateStooniesPanel() {
        const panel = this.panels.stoonies;
        const stoonies = this.gameEngine.entityManager.getEntitiesByType('Stoonie');
        
        let html = '<div class="stoonies-list">';
        stoonies.forEach(stoonie => {
            html += `
                <div class="stoonie-item" onclick="this.gameEngine.selectionManager.setSelection([${stoonie.id}])">
                    <div class="stoonie-name">${stoonie.name || 'Unnamed Stoonie'}</div>
                    <div class="stoonie-stats">
                        <div>Health: ${stoonie.health}/${stoonie.maxHealth}</div>
                        <div>Status: ${stoonie.status || 'Normal'}</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        panel.innerHTML = html;
    }

    updateBuildingsPanel() {
        const panel = this.panels.buildings;
        const buildings = this.gameEngine.entityManager.getEntitiesByType('Building');
        
        let html = `
            <div class="buildings-controls">
                <button onclick="this.gameEngine.buildingSystem.startPlacement('house')">Place House</button>
                <button onclick="this.gameEngine.buildingSystem.startPlacement('storage')">Place Storage</button>
            </div>
            <div class="buildings-list">
        `;
        
        buildings.forEach(building => {
            html += `
                <div class="building-item" onclick="this.gameEngine.selectionManager.setSelection([${building.id}])">
                    <div class="building-name">${building.type}</div>
                    <div class="building-stats">
                        <div>Health: ${building.health}/${building.maxHealth}</div>
                        <div>Status: ${building.status || 'Normal'}</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        panel.innerHTML = html;
    }

    generateEntityStats(entity) {
        return `
            <div class="entity-stats">
                <h3>${entity.name || entity.type}</h3>
                <div class="stat-row">
                    <label>Health:</label>
                    <div class="health-bar">
                        <div class="health-fill" style="width: ${(entity.health / entity.maxHealth) * 100}%"></div>
                        <span>${entity.health}/${entity.maxHealth}</span>
                    </div>
                </div>
                ${entity.status ? `
                    <div class="stat-row">
                        <label>Status:</label>
                        <span>${entity.status}</span>
                    </div>
                ` : ''}
                ${this.generateEntitySpecificStats(entity)}
            </div>
        `;
    }

    generateEntitySpecificStats(entity) {
        switch(entity.type) {
            case 'Soul':
                return `
                    <div class="stat-row">
                        <label>Energy:</label>
                        <span>${entity.energy || 0}</span>
                    </div>
                `;
            case 'Stoonie':
                return `
                    <div class="stat-row">
                        <label>Task:</label>
                        <span>${entity.currentTask || 'Idle'}</span>
                    </div>
                `;
            case 'Building':
                return `
                    <div class="stat-row">
                        <label>Type:</label>
                        <span>${entity.buildingType}</span>
                    </div>
                `;
            default:
                return '';
        }
    }

    generateGroupSelection(selection) {
        const types = {};
        selection.forEach(entity => {
            types[entity.type] = (types[entity.type] || 0) + 1;
        });

        let html = `
            <div class="group-selection">
                <h3>Group Selection (${selection.length})</h3>
                <div class="selection-breakdown">
        `;

        for (const [type, count] of Object.entries(types)) {
            html += `
                <div class="type-count">
                    <span class="type">${type}:</span>
                    <span class="count">${count}</span>
                </div>
            `;
        }

        html += '</div></div>';
        return html;
    }

    setupEventListeners() {
        let ctrlPressed = false;

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Control') {
                ctrlPressed = true;
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 'Control') {
                ctrlPressed = false;
            }
        });

        // Soul dragging events
        this.panels.souls.addEventListener('mousedown', (event) => {
            const soulItem = event.target.closest('.soul-item');
            if (soulItem) {
                const soulId = soulItem.dataset.soulId;
                this.draggedSoul = this.gameEngine.soulManager.souls.get(soulId);
                if (this.draggedSoul) {
                    soulItem.style.opacity = '0.5';
                    this.createDragVisual(event);
                }
            }
        });

        // Example selection logic
        this.panels.souls.addEventListener('mousedown', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const soulItem = event.target.closest('.soul-item');
            if (soulItem) {
                const soulId = soulItem.dataset.soulId;
                const entity = this.gameEngine.entityManager.getEntityById(soulId);
                if (entity) {
                    if (ctrlPressed) {
                        console.log(`Toggling selection for ${soulId}`);
                        // Toggle selection state
                        entity.toggleSelection();
                        soulItem.classList.toggle('selected', entity.isSelected);
                    } else {
                        console.log(`Selecting only ${soulId}`);
                        // Clear previous selections
                        this.panels.souls.querySelectorAll('.soul-item.selected').forEach(item => {
                            item.classList.remove('selected');
                            const id = item.dataset.soulId;
                            const ent = this.gameEngine.entityManager.getEntityById(id);
                            if (ent) ent.isSelected = false;
                        });
                        entity.isSelected = true;
                        soulItem.classList.add('selected');
                    }
                }
            }
        });

        document.addEventListener('mousemove', (event) => {
            // Update mouse position for UI interactions
            this.mousePosition = { x: event.clientX, y: event.clientY };
            
            // Update drag visual if dragging a soul
            if (this.draggedSoul) {
                const dragVisual = document.getElementById('drag-visual');
                if (dragVisual) {
                    dragVisual.style.left = `${event.clientX}px`;
                    dragVisual.style.top = `${event.clientY}px`;
                }
                
                // Check for Stoonie under mouse
                const mouse = new THREE.Vector2(
                    (event.clientX / window.innerWidth) * 2 - 1,
                    -(event.clientY / window.innerHeight) * 2 + 1
                );

                this.gameEngine.raycaster.setFromCamera(mouse, this.gameEngine.camera);
                const intersects = this.gameEngine.raycaster.intersectObjects(this.gameEngine.scene.children, true);

                let foundStoonie = false;
                for (const intersect of intersects) {
                    const entity = this.gameEngine.entityManager.getEntityByMesh(intersect.object);
                    if (entity && entity.constructor.name === 'Stoonie') {
                        entity.mesh.material.emissive.setHex(0x444444);
                        foundStoonie = true;
                        break;
                    }
                }

                if (!foundStoonie) {
                    // Reset all Stoonie materials
                    this.gameEngine.entityManager.getEntities().forEach(entity => {
                        if (entity.constructor.name === 'Stoonie') {
                            entity.mesh.material.emissive.setHex(0x000000);
                        }
                    });
                }
            }
        });

        document.addEventListener('mouseup', (event) => {
            if (this.draggedSoul) {
                // Remove drag visual
                const dragVisual = document.getElementById('drag-visual');
                if (dragVisual) {
                    dragVisual.remove();
                }

                // Reset soul item opacity
                const soulItem = document.querySelector(`.soul-item[data-soul-id="${this.draggedSoul.id}"]`);
                if (soulItem) {
                    soulItem.style.opacity = '1';
                }

                // Check if we're over a Stoonie
                const mouse = new THREE.Vector2(
                    (event.clientX / window.innerWidth) * 2 - 1,
                    -(event.clientY / window.innerHeight) * 2 + 1
                );

                this.gameEngine.raycaster.setFromCamera(mouse, this.gameEngine.camera);
                const intersects = this.gameEngine.raycaster.intersectObjects(this.gameEngine.scene.children, true);

                for (const intersect of intersects) {
                    const entity = this.gameEngine.entityManager.getEntityByMesh(intersect.object);
                    if (entity && entity.constructor.name === 'Stoonie') {
                        this.gameEngine.soulManager.connectSoulToStoonie(this.draggedSoul, entity);
                        break;
                    }
                }

                // Reset all Stoonie materials
                this.gameEngine.entityManager.getEntities().forEach(entity => {
                    if (entity.constructor.name === 'Stoonie') {
                        entity.mesh.material.emissive.setHex(0x000000);
                    }
                });

                this.draggedSoul = null;
                this.updateSoulsPanel();
            }
        });

        document.removeEventListener('mouseup', this.mouseUpHandler);
    }

    updateHoveredEntity(event) {
        if (this.draggedSoul) return; // Don't update hover while dragging

        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        this.gameEngine.raycaster.setFromCamera(mouse, this.gameEngine.camera);
        const intersects = this.gameEngine.raycaster.intersectObjects(this.gameEngine.scene.children, true);

        let hoveredEntity = null;
        for (const intersect of intersects) {
            const entity = this.gameEngine.entityManager.getEntityByMesh(intersect.object);
            if (entity) {
                hoveredEntity = entity;
                break;
            }
        }

        this.setHoveredEntity(hoveredEntity);
    }

    clearHoveredEntity() {
        this.setHoveredEntity(null);
    }

    getCanvas() {
        return this.canvas;
    }

    resizeCanvas() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    update(deltaTime) {
        if (!this.initialized) return;

        // Update selection info panel
        this.updateSelectionInfoPanel();

        // Update other UI elements
        this.updateTabContent(this.currentTab);
        if (this.statsOverlay) {
            this.statsOverlay.update();
        }
    }

    updateSelectionInfoPanel() {
        const selection = this.gameEngine.selectionManager.getSelection();
        
        if (selection.length === 0) {
            this.leftPanel.style.display = 'none';
            return;
        }

        this.leftPanel.style.display = 'block';

        // Count entities by type
        const counts = {
            total: selection.length,
            Stoonie: 0,
            Demon: 0,
            Building: 0,
            Tree: 0,
            Other: 0
        };

        selection.forEach(entity => {
            const type = entity.constructor.name;
            if (counts.hasOwnProperty(type)) {
                counts[type]++;
            } else {
                counts.Other++;
            }
        });

        // Generate HTML content
        let content = '<h2>Selection Info</h2>';

        // If only one entity is selected, show detailed info
        if (selection.length === 1) {
            const entity = selection[0];
            content += this.generateDetailedEntityInfo(entity);
        } else {
            // Show summary of selected entities
            content += '<div class="selection-summary">';
            content += `<p>Total Selected: ${counts.total}</p>`;
            for (const [type, count] of Object.entries(counts)) {
                if (type !== 'total' && count > 0) {
                    content += `<p>${type}s: ${count}</p>`;
                }
            }
            content += '</div>';
        }

        this.leftPanel.innerHTML = content;
    }

    generateDetailedEntityInfo(entity) {
        let content = `<div class="entity-details">`;
        content += `<h3>${entity.constructor.name} #${entity.id}</h3>`;

        // Common properties
        if (entity.health !== undefined) {
            const healthPercent = (entity.health / 100) * 100;
            content += `
                <div class="stat-bar">
                    <label>Health:</label>
                    <div class="bar-container">
                        <div class="bar-fill health-fill" style="width: ${healthPercent}%"></div>
                        <span>${Math.round(entity.health)}/100</span>
                    </div>
                </div>`;
        }
        if (entity.energy !== undefined) {
            const energyPercent = (entity.energy / 100) * 100;
            content += `
                <div class="stat-bar">
                    <label>Energy:</label>
                    <div class="bar-container">
                        <div class="bar-fill energy-fill" style="width: ${energyPercent}%"></div>
                        <span>${Math.round(entity.energy)}/100</span>
                    </div>
                </div>`;
        }

        // Stoonie-specific properties
        if (entity.constructor.name === 'Stoonie') {
            content += `<p>Gender: ${entity.gender}</p>`;
            if (entity.isPregnant) {
                const progress = (entity.pregnancyTime / entity.pregnancyDuration * 100).toFixed(1);
                content += `
                    <div class="stat-bar">
                        <label>Pregnancy:</label>
                        <div class="bar-container">
                            <div class="bar-fill pregnancy-fill" style="width: ${progress}%"></div>
                            <span>${progress}%</span>
                        </div>
                    </div>`;
            }
            if (entity.soul) {
                content += `<p>Soul Type: ${entity.soul.type}</p>`;
            }
            content += `<p>State: ${entity.behaviorState}</p>`;
        }

        // Demon-specific properties
        if (entity.constructor.name === 'Demon') {
            content += `<p>Attack Damage: ${entity.attackDamage}</p>`;
            content += `<p>State: ${entity.behaviorState}</p>`;
        }

        // Building-specific properties
        if (entity.constructor.name === 'Building') {
            content += `<p>Type: ${entity.buildingType}</p>`;
            if (entity.progress !== undefined) {
                const buildProgress = (entity.progress * 100).toFixed(1);
                content += `
                    <div class="stat-bar">
                        <label>Construction:</label>
                        <div class="bar-container">
                            <div class="bar-fill construction-fill" style="width: ${buildProgress}%"></div>
                            <span>${buildProgress}%</span>
                        </div>
                    </div>`;
            }
        }

        content += '</div>';
        return content;
    }

    setHoveredEntity(entity) {
        if (entity !== this.hoveredEntity) {
            this.hoveredEntity = entity;
            if (this.statsOverlay) {
                if (entity) {
                    this.statsOverlay.show(entity);
                    this.statsOverlay.mousePosition = this.mousePosition;
                } else {
                    this.statsOverlay.hide();
                }
            }
        }
    }

    createDragVisual(event) {
        const dragVisual = document.createElement('div');
        dragVisual.id = 'drag-visual';
        dragVisual.style.position = 'fixed';
        dragVisual.style.pointerEvents = 'none';
        dragVisual.style.zIndex = '1000';
        dragVisual.style.width = '32px';
        dragVisual.style.height = '32px';
        dragVisual.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        dragVisual.style.borderRadius = '50%';
        dragVisual.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
        dragVisual.style.left = `${event.clientX}px`;
        dragVisual.style.top = `${event.clientY}px`;
        dragVisual.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(dragVisual);
    }
}
