const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    console.log(`[REQ] ${req.url}`);
    
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';
    
    filePath = path.join(__dirname, filePath);
    
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('404 Not Found');
            console.log(`[404] ${filePath}`);
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(8000, () => {
    console.log('Server running at http://127.0.0.1:8000/');
});
