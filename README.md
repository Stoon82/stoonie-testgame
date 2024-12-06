# Stoonie Test Game

A prototype game built with Three.js featuring Stoonies - unique entities that can interact with their environment.

## Features

- Male and female Stoonies (represented by red and blue spheres)
- Demon Stoonies (enemy entities)
- Environmental objects (trees and buildings)
- Basic physics and entity management
- Modular codebase structure

## Setup

1. Clone the repository:
```bash
git clone https://github.com/Stoon82/stoonie-testgame.git
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

- `frontend/`
  - `js/`
    - `core/` - Core game systems
    - `entities/` - Game entities (Stoonies, DemonStoonies)
    - `environment/` - Environmental objects
- `server.js` - Express server
