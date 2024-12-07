export default class DetailsPanel {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.panel = null;
        this.contentContainer = null;
        this.initialized = false;
        this.activeTab = 'selected';
    }

    initialize() {
        if (this.initialized) return;
        
        this.panel = document.getElementById('details-panel');
        if (!this.panel) {
            this.panel = document.createElement('div');
            this.panel.id = 'details-panel';
            
            // Create tabs container
            const tabsContainer = document.createElement('div');
            tabsContainer.className = 'tabs-container';
            tabsContainer.style.display = 'flex';
            tabsContainer.style.gap = '5px';
            tabsContainer.style.marginBottom = '10px';
            
            // Create tabs
            const tabs = [
                { id: 'selected', text: 'Selected' },
                { id: 'all', text: 'All Stoonies' },
                { id: 'connected', text: 'Soul Connected' }
            ];
            
            tabs.forEach(tab => {
                const tabElement = document.createElement('button');
                tabElement.id = `tab-${tab.id}`;
                tabElement.textContent = tab.text;
                tabElement.className = 'tab-button';
                tabElement.style.padding = '5px 10px';
                tabElement.style.backgroundColor = tab.id === 'selected' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.3)';
                tabElement.style.border = 'none';
                tabElement.style.borderRadius = '3px';
                tabElement.style.color = 'white';
                tabElement.style.cursor = 'pointer';
                tabElement.onclick = () => this.switchTab(tab.id);
                tabsContainer.appendChild(tabElement);
            });
            
            // Create content container
            this.contentContainer = document.createElement('div');
            this.contentContainer.id = 'details-content';
            this.contentContainer.style.minHeight = '200px';
            this.contentContainer.style.maxHeight = '400px';
            this.contentContainer.style.overflowY = 'auto';
            
            this.panel.appendChild(tabsContainer);
            this.panel.appendChild(this.contentContainer);
            document.body.appendChild(this.panel);
        }
        
        this.applyStyles();
        this.initialized = true;
    }

    applyStyles() {
        Object.assign(this.panel.style, {
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '300px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '10px',
            borderRadius: '5px',
            color: 'white',
            zIndex: '1000',
            maxHeight: '80vh',
            overflowY: 'auto'
        });

        // Add custom scrollbar styles
        const style = document.createElement('style');
        style.textContent = `
            #${this.panel.id}::-webkit-scrollbar {
                width: 8px;
            }
            #${this.panel.id}::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
            }
            #${this.panel.id}::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 4px;
            }
            #${this.panel.id}::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.4);
            }
        `;
        document.head.appendChild(style);
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        // Update tab button styles
        const tabs = ['selected', 'all', 'connected'];
        tabs.forEach(tab => {
            const button = document.getElementById(`tab-${tab}`);
            if (button) {
                button.style.backgroundColor = tab === tabId ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.3)';
            }
        });

        this.updateContent();
    }

    updateContent() {
        if (!this.contentContainer) return;

        let entities = [];
        switch (this.activeTab) {
            case 'selected':
                if (this.gameEngine.selectedEntity) {
                    entities = [this.gameEngine.selectedEntity];
                }
                break;
            case 'all':
                entities = Array.from(this.gameEngine.entityManager.entities)
                    .filter(entity => entity.constructor.name === 'Stoonie');
                break;
            case 'connected':
                entities = Array.from(this.gameEngine.entityManager.entities)
                    .filter(entity => entity.constructor.name === 'Stoonie' && entity.soul);
                break;
        }

        this.contentContainer.innerHTML = '';
        if (entities.length === 0) {
            this.contentContainer.innerHTML = '<p style="text-align: center; padding: 20px;">No Stoonies to display</p>';
            return;
        }

        entities.forEach(entity => {
            const entityCard = document.createElement('div');
            entityCard.className = 'entity-card';
            entityCard.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            entityCard.style.padding = '10px';
            entityCard.style.marginBottom = '5px';
            entityCard.style.borderRadius = '3px';
            entityCard.style.cursor = 'pointer';
            
            entityCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Stoonie #${entity.id}</span>
                    <span style="color: ${entity.soul ? '#90EE90' : '#FFB6C1'}">${entity.soul ? '●' : '○'}</span>
                </div>
                <div style="margin-top: 5px; font-size: 0.9em;">
                    <div>Health: ${Math.floor(entity.health)}</div>
                    <div>Age: ${Math.floor(entity.age)}</div>
                    ${entity.soul ? `
                        <div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
                            <div>Soul: ${entity.soul.name}</div>
                            <div>Level: ${entity.soul.level}</div>
                            <div>XP: ${Math.floor(entity.soul.experience)}</div>
                        </div>
                    ` : ''}
                </div>
            `;

            entityCard.onclick = () => {
                this.gameEngine.selectedEntity = entity;
                this.switchTab('selected');
            };

            this.contentContainer.appendChild(entityCard);
        });
    }

    update() {
        if (!this.initialized) return;
        this.updateContent();
    }
}