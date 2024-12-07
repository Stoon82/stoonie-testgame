export default class StatsOverlay {
    constructor(parent, gameEngine) {
        this.parent = parent;
        this.gameEngine = gameEngine;
        this.overlay = null;
        this.hoveredEntity = null;
        this.mousePosition = { x: 0, y: 0 };
        this.initialize();
    }

    initialize() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'stats-overlay';
        Object.assign(this.overlay.style, {
            position: 'absolute',
            display: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '14px',
            pointerEvents: 'none',
            zIndex: '1000',
            minWidth: '200px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        });
        this.parent.appendChild(this.overlay);
    }

    show(entity) {
        if (!entity) {
            this.hide();
            return;
        }

        this.hoveredEntity = entity;
        this.updateOverlay();
        this.overlay.style.display = 'block';
        this.updatePosition();
    }

    hide() {
        this.hoveredEntity = null;
        this.overlay.style.display = 'none';
    }

    update(deltaTime) {
        if (this.hoveredEntity && this.overlay.style.display !== 'none') {
            this.updateOverlay();
            this.updatePosition();
        }
    }

    updatePosition() {
        if (!this.hoveredEntity || !this.mousePosition) return;

        const padding = 20;
        const rect = this.overlay.getBoundingClientRect();
        let x = this.mousePosition.x + padding;
        let y = this.mousePosition.y + padding;

        // Keep overlay within window bounds
        if (x + rect.width > window.innerWidth) {
            x = this.mousePosition.x - rect.width - padding;
        }
        if (y + rect.height > window.innerHeight) {
            y = this.mousePosition.y - rect.height - padding;
        }

        this.overlay.style.left = `${x}px`;
        this.overlay.style.top = `${y}px`;
    }

    updateOverlay() {
        if (!this.hoveredEntity) return;

        const entity = this.hoveredEntity;
        let content = '';

        if (entity.constructor.name === 'Stoonie') {
            const genderSymbol = entity.gender === 'male' ? '♂' : '♀';
            const genderColor = entity.gender === 'male' ? '#ff6b6b' : '#4ecdc4';
            const needs = entity.needs || {};
            
            content = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span>Stoonie #${entity.id}</span>
                    <span style="color: ${genderColor}; font-size: 18px;">${genderSymbol}</span>
                </div>
                <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="color: #ff7675;">Health:</span>
                        <div style="width: 100px; background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; margin-left: 10px; position: relative;">
                            <div style="width: ${entity.health}%; background: #ff7675; height: 100%; border-radius: 4px;"></div>
                            <span style="position: absolute; right: -30px; font-size: 12px;">${Math.floor(entity.health)}%</span>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="color: #74b9ff;">Energy:</span>
                        <div style="width: 100px; background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; margin-left: 10px; position: relative;">
                            <div style="width: ${entity.energy}%; background: #74b9ff; height: 100%; border-radius: 4px;"></div>
                            <span style="position: absolute; right: -30px; font-size: 12px;">${Math.floor(entity.energy)}%</span>
                        </div>
                    </div>
                </div>`;

            if (Object.keys(needs).length > 0) {
                content += `
                <div style="margin-top: 8px;">
                    <div style="margin-bottom: 5px; color: #a8a8a8;">Needs:</div>
                    ${Object.entries(needs).map(([need, value]) => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                            <span style="color: #a8e6cf;">${need}:</span>
                            <div style="width: 100px; background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; margin-left: 10px; position: relative;">
                                <div style="width: ${value}%; background: #a8e6cf; height: 100%; border-radius: 4px;"></div>
                                <span style="position: absolute; right: -30px; font-size: 12px;">${Math.floor(value)}%</span>
                            </div>
                        </div>
                    `).join('')}
                </div>`;
            }

            if (entity.soul) {
                content += `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div style="color: #a29bfe;">
                        Soul: ${entity.soul.name} (Level ${entity.soul.level})
                    </div>
                </div>`;
            }
        } else if (entity.constructor.name === 'Tree') {
            const pos = entity.mesh.position;
            content = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="color: #2ecc71;">🌲 Tree</span>
                </div>
                <div style="margin-bottom: 5px;">
                    <div style="color: #a8a8a8;">Position</div>
                    <div>X: ${pos.x.toFixed(1)}</div>
                    <div>Z: ${pos.z.toFixed(1)}</div>
                </div>
                <div style="margin-top: 8px; color: #a8e6cf;">
                    <div>Resources available</div>
                    <div style="font-size: 12px; color: #95a5a6; margin-top: 4px;">
                        Click to gather
                    </div>
                </div>`;
        } else if (entity.constructor.name === 'Building') {
            const pos = entity.mesh.position;
            content = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="color: #e67e22;">🏠 Building</span>
                </div>
                <div style="margin-bottom: 5px;">
                    <div style="color: #a8a8a8;">Position</div>
                    <div>X: ${pos.x.toFixed(1)}</div>
                    <div>Z: ${pos.z.toFixed(1)}</div>
                </div>
                <div style="margin-top: 8px; color: #f39c12;">
                    <div>Shelter</div>
                    <div style="font-size: 12px; color: #95a5a6; margin-top: 4px;">
                        Click to enter
                    </div>
                </div>`;
        }

        this.overlay.innerHTML = content;
    }
}
