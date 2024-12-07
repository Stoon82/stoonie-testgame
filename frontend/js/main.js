import GameEngine from './core/GameEngine.js';

// Create a global variable to store the game engine instance
let gameEngine;

async function startGame() {
    try {
        console.log('Starting game...');
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        document.body.appendChild(canvas);
        
        // Initialize game engine with canvas
        gameEngine = new GameEngine(canvas);
        await gameEngine.initialize();
        console.log('Game started successfully');
        
        // Make gameEngine accessible globally
        window.gameEngine = gameEngine;
    } catch (error) {
        console.error('Failed to start game:', error);
    }
}

// Start the game when the page loads
window.addEventListener('load', startGame);