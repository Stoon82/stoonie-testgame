import * as THREE from 'three';

export default class UIOverlay {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.setupUI();
        this.setupSoulPanel();
        this.selectedSoul = null;
        this.draggingSoul = false;
    }

    setupUI() {
        this.container = null;
        this.soulPanel = null;
        this.draggedSoul = null;
        this.hoveredStoonie = null;
        this.init();
    }

    setupSoulPanel() {
        // Create soul panel container
        this.soulPanel = document.createElement('div');
        this.soulPanel.id = 'soulPanel';
        this.soulPanel.style.position = 'absolute';
        this.soulPanel.style.right = '20px';
        this.soulPanel.style.top = '20px';
        this.soulPanel.style.width = '200px';
        this.soulPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.soulPanel.style.padding = '10px';
        this.soulPanel.style.borderRadius = '5px';
        this.soulPanel.style.color = 'white';

        const title = document.createElement('h3');
        title.textContent = 'Available Souls';
        title.style.margin = '0 0 10px 0';
        this.soulPanel.appendChild(title);

        // Container for soul items
        this.soulContainer = document.createElement('div');
        this.soulContainer.style.display = 'flex';
        this.soulContainer.style.flexDirection = 'column';
        this.soulContainer.style.gap = '5px';
        this.soulPanel.appendChild(this.soulContainer);

        document.body.appendChild(this.soulPanel);

        // Setup drag events
        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('mouseup', this.handleDragEnd.bind(this));
    }

    init() {
        this.createMainContainer();
        this.createSpawnButtons();
        this.setupDragEvents();
    }

    createMainContainer() {
        // Create UI container
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 1000;
            display: flex;
            gap: 10px;
        `;
        document.body.appendChild(this.container);
    }

    createSpawnButtons() {
        // Add Stoonie button
        const addStoonieBtn = document.createElement('button');
        addStoonieBtn.textContent = '+ Add Stoonie';
        addStoonieBtn.style.cssText = `
            padding: 10px 20px;
            font-size: 16px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        `;
        addStoonieBtn.addEventListener('mouseover', () => addStoonieBtn.style.background = '#45a049');
        addStoonieBtn.addEventListener('mouseout', () => addStoonieBtn.style.background = '#4CAF50');
        addStoonieBtn.addEventListener('click', () => {
            const randomPosition = new THREE.Vector3(
                (Math.random() - 0.5) * 40,
                0,
                (Math.random() - 0.5) * 40
            );
            this.gameEngine.entityManager.createStoonie({ position: randomPosition });
        });
        this.container.appendChild(addStoonieBtn);

        // Add Demon button
        const addDemonBtn = document.createElement('button');
        addDemonBtn.textContent = '+ Add Demon';
        addDemonBtn.style.cssText = `
            padding: 10px 20px;
            font-size: 16px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        `;
        addDemonBtn.addEventListener('mouseover', () => addDemonBtn.style.background = '#da190b');
        addDemonBtn.addEventListener('mouseout', () => addDemonBtn.style.background = '#f44336');
        addDemonBtn.addEventListener('click', () => {
            const randomPosition = new THREE.Vector3(
                (Math.random() - 0.5) * 40,
                0,
                (Math.random() - 0.5) * 40
            );
            this.gameEngine.entityManager.createDemonStoonie({ position: randomPosition });
        });
        this.container.appendChild(addDemonBtn);
    }

    setupDragEvents() {
        // Track dragged soul and hovered stoonie
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('soul-item')) {
                this.draggedSoul = this.gameEngine.soulManager.souls.get(
                    parseInt(e.target.dataset.soulId)
                );
                e.target.style.opacity = '0.5';
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('soul-item')) {
                e.target.style.opacity = '1';
                this.draggedSoul = null;
            }
        });

        // Handle dropping soul on stoonie
        document.addEventListener('mousemove', (e) => {
            if (this.draggedSoul) {
                const intersects = this.gameEngine.uiManager.getIntersects(e.clientX, e.clientY);
                this.hoveredStoonie = null;
                
                for (const intersect of intersects) {
                    if (intersect.object.entity?.constructor.name === 'Stoonie') {
                        this.hoveredStoonie = intersect.object.entity;
                        // Highlight potential target
                        this.hoveredStoonie.mesh.material.emissive.setHex(0x444444);
                        break;
                    }
                }
                
                // Remove highlight from non-targets
                this.gameEngine.entityManager.entities.forEach(entity => {
                    if (entity !== this.hoveredStoonie && entity.constructor.name === 'Stoonie') {
                        entity.mesh.material.emissive.setHex(0x000000);
                    }
                });
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.draggedSoul && this.hoveredStoonie) {
                if (this.hoveredStoonie.soul) {
                    // Disconnect existing soul first
                    this.gameEngine.soulManager.disconnectSoulFromStoonie(this.hoveredStoonie);
                }
                // Connect new soul
                this.gameEngine.soulManager.connectSoulToStoonie(this.hoveredStoonie, this.draggedSoul);
            }
            
            // Clear highlights
            this.gameEngine.entityManager.entities.forEach(entity => {
                if (entity.constructor.name === 'Stoonie') {
                    entity.mesh.material.emissive.setHex(0x000000);
                }
            });
            
            this.draggedSoul = null;
            this.hoveredStoonie = null;
        });
    }

    createSoulElement(soul) {
        const soulElement = document.createElement('div');
        soulElement.className = 'soul-item';
        soulElement.style.padding = '5px';
        soulElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        soulElement.style.borderRadius = '3px';
        soulElement.style.cursor = 'grab';
        soulElement.style.userSelect = 'none';

        soulElement.innerHTML = `
            Level ${soul.level} Soul
            <div class="soul-exp">XP: ${soul.experience}/${soul.experienceToNextLevel}</div>
        `;

        soulElement.addEventListener('mousedown', (e) => {
            this.startDragging(e, soul, soulElement);
        });

        return soulElement;
    }

    startDragging(e, soul, element) {
        this.draggingSoul = true;
        this.selectedSoul = soul;
        
        // Create drag preview
        this.dragPreview = element.cloneNode(true);
        this.dragPreview.style.position = 'fixed';
        this.dragPreview.style.pointerEvents = 'none';
        this.dragPreview.style.opacity = '0.8';
        document.body.appendChild(this.dragPreview);
        
        this.updateDragPreview(e);
    }

    handleDrag(e) {
        if (this.draggingSoul) {
            this.updateDragPreview(e);
            
            // Check for hover over Stoonie
            const hoveredStoonie = this.gameEngine.entityManager.getHoveredStoonie(e);
            if (hoveredStoonie) {
                hoveredStoonie.highlight = true;
            }
        }
    }

    updateDragPreview(e) {
        if (this.dragPreview) {
            this.dragPreview.style.left = e.clientX + 10 + 'px';
            this.dragPreview.style.top = e.clientY + 10 + 'px';
        }
    }

    handleDragEnd(e) {
        if (this.draggingSoul) {
            const hoveredStoonie = this.gameEngine.entityManager.getHoveredStoonie(e);
            if (hoveredStoonie && this.selectedSoul) {
                this.gameEngine.soulManager.connectSoulToStoonie(this.selectedSoul, hoveredStoonie);
            }

            // Clean up
            if (this.dragPreview) {
                this.dragPreview.remove();
                this.dragPreview = null;
            }
            this.draggingSoul = false;
            this.selectedSoul = null;
        }
    }

    update() {
        if (!this.gameEngine.soulManager || !this.soulContainer) {
            return;
        }

        // Clear existing souls
        this.soulContainer.innerHTML = '';
        
        // Get available souls directly from the availableSouls array
        const availableSouls = [...this.gameEngine.soulManager.availableSouls];
        
        // Create and append soul elements
        availableSouls.forEach(soul => {
            const soulElement = this.createSoulElement(soul);
            this.soulContainer.appendChild(soulElement);
        });
    }
}
