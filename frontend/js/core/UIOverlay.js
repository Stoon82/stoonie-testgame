export class UIOverlay {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.container = null;
        this.init();
    }

    init() {
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
        addStoonieBtn.addEventListener('mouseover', () => {
            addStoonieBtn.style.background = '#45a049';
        });
        addStoonieBtn.addEventListener('mouseout', () => {
            addStoonieBtn.style.background = '#4CAF50';
        });
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
        addDemonBtn.addEventListener('mouseover', () => {
            addDemonBtn.style.background = '#da190b';
        });
        addDemonBtn.addEventListener('mouseout', () => {
            addDemonBtn.style.background = '#f44336';
        });
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
}
