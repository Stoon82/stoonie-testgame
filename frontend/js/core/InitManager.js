export default class InitManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.initStatus = new Map();
        this.initOrder = [
            'worldManager',
            'entityManager',
            'soulManager',
            'uiManager'
        ];
        this.initialized = false;
    }

    registerManager(managerName, manager) {
        if (!this.initStatus.has(managerName)) {
            this.initStatus.set(managerName, {
                manager: manager,
                isInitialized: false,
                error: null
            });
        }
    }

    async initializeGame() {
        try {
            for (const managerName of this.initOrder) {
                const status = this.initStatus.get(managerName);
                if (!status) {
                    throw new Error(`Manager ${managerName} not registered`);
                }

                try {
                    await status.manager.initialize();
                    status.isInitialized = true;
                } catch (error) {
                    status.error = error;
                    throw new Error(`Failed to initialize ${managerName}: ${error.message}`);
                }
            }
            this.initialized = true;
            console.log('Game initialization complete');
        } catch (error) {
            console.error('Game initialization failed:', error);
            throw error;
        }
    }

    isManagerInitialized(managerName) {
        const status = this.initStatus.get(managerName);
        return status ? status.isInitialized : false;
    }

    isGameInitialized() {
        return this.initialized;
    }

    getInitializationStatus() {
        const status = {};
        this.initStatus.forEach((value, key) => {
            status[key] = {
                isInitialized: value.isInitialized,
                error: value.error ? value.error.message : null
            };
        });
        return status;
    }
}
