const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static('frontend'));
// Serve node_modules (needed for three.js)
app.use('/node_modules', express.static('node_modules'));

// Basic route for the game
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Bug report endpoint
app.post('/api/bug-report', (req, res) => {
    const bugReport = {
        timestamp: new Date().toISOString(),
        description: req.body.description,
        systemInfo: req.body.systemInfo,
        errorLogs: req.body.errorLogs
    };

    const bugReportsPath = path.join(__dirname, 'bug-reports.json');
    
    // Read existing reports or create new array
    let reports = [];
    if (fs.existsSync(bugReportsPath)) {
        const fileContent = fs.readFileSync(bugReportsPath, 'utf8');
        reports = JSON.parse(fileContent);
    }
    
    // Add new report
    reports.push(bugReport);
    
    // Write back to file
    fs.writeFileSync(bugReportsPath, JSON.stringify(reports, null, 2));
    
    res.json({ success: true, message: 'Bug report submitted successfully' });
});

app.listen(port, () => {
    console.log(`Stoonie Game server running at http://localhost:${port}`);
});
