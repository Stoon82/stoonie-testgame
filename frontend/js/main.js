import GameEngine from './core/GameEngine.js';

async function startGame() {
    try {
        console.log('Starting game...');
        const gameEngine = new GameEngine();
        await gameEngine.initialize();
        console.log('Game started successfully');
    } catch (error) {
        console.error('Failed to start game:', error);
    }
}

// Start the game when the page loads
window.addEventListener('load', startGame);