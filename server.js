const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from frontend directory
app.use(express.static('frontend'));
// Serve node_modules (needed for three.js)
app.use('/node_modules', express.static('node_modules'));

// Basic route for the game
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(port, () => {
    console.log(`Stoonie Game server running at http://localhost:${port}`);
});
