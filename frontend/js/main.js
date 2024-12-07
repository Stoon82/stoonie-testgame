import GameEngine from './core/GameEngine.js';

// Create a global variable to store the game engine instance
let gameEngine;

async function startGame() {
    try {
        console.log('Starting game...');
        gameEngine = new GameEngine();
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