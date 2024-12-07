import GameEngine from './core/GameEngine.js';

async function startGame() {
    try {
        const gameEngine = new GameEngine();
        await gameEngine.initialize();
        console.log('Game started successfully');
    } catch (error) {
        console.error('Failed to start game:', error);
    }
}

window.addEventListener('load', startGame);