/**
 * Image Quality MCP Server
 * 
 * A simple MCP server to provide image quality assessment services for the
 * Lightroom Image Quality Rank plugin. This server receives images, evaluates
 * them (using mock data for this sample implementation), and returns quality scores.
 * 
 * In a real implementation, this would connect to an actual AI model for image quality assessment.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const PORT = 3000;
const TEMP_DIR = path.join(__dirname, 'temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Mock AI model for image quality assessment
class MockImageQualityModel {
    // Evaluate image and return quality score (0-100)
    evaluateImage(imagePath) {
        // This is where a real AI model would process the image
        // For this mock implementation, we'll generate a random score
        // with some bias based on the image file size
        
        try {
            const stats = fs.statSync(imagePath);
            const fileSize = stats.size;
            
            // Base score - random between 50-90
            let baseScore = 50 + Math.random() * 40;
            
            // Add some bias based on file size (larger files often have more detail)
            // This is just for demonstration - not a real quality metric!
            const fileSizeMB = fileSize / (1024 * 1024);
            const sizeBonus = Math.min(10, fileSizeMB * 2); // Up to 10 point bonus for larger files
            
            let score = Math.min(100, baseScore + sizeBonus);
            
            // Generate mock detailed analysis
            const details = {
                technicalQuality: this.generateSubScore(score, 15),
                composition: this.generateSubScore(score, 20),
                exposure: this.generateSubScore(score, 10),
                sharpness: this.generateSubScore(score, 15),
                noise: this.generateSubScore(score, 10),
                colorBalance: this.generateSubScore(score, 12),
            };
            
            return {
                success: true,
                score: Math.round(score * 10) / 10, // Round to 1 decimal place
                details: details
            };
        } catch (error) {
            console.error('Error evaluating image:', error);
            return {
                success: false,
                error: 'Failed to evaluate image: ' + error.message
            };
        }
    }
    
    // Generate a sub-score that's somewhat correlated with the main score
    generateSubScore(mainScore, variance) {
        // Generate a score with some randomness but correlated with the main score
        const min = Math.max(0, mainScore - variance);
        const max = Math.min(100, mainScore + variance);
        return Math.round((min + Math.random() * (max - min)) * 10) / 10;
    }
}

// Create the model instance
const qualityModel = new MockImageQualityModel();

// Create HTTP server
const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // Handle evaluate-image endpoint
    if (req.url === '/evaluate-image' && req.method === 'POST') {
        handleEvaluateImage(req, res);
        return;
    }
    
    // Handle root endpoint
    if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            name: 'Image Quality MCP',
            version: '1.0.0',
            endpoints: ['/evaluate-image']
        }));
        return;
    }
    
    // 404 for all other requests
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

// Handle image evaluation requests
function handleEvaluateImage(req, res) {
    // Check content type
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
        // Handle JSON requests (base64 encoded image)
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                if (!data.image) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing image data' }));
                    return;
                }
                
                // Decode base64 image
                const imageBuffer = Buffer.from(data.image, 'base64');
                
                // Save to temp file
                const tempFilePath = path.join(TEMP_DIR, `image-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.jpg`);
                fs.writeFileSync(tempFilePath, imageBuffer);
                
                // Evaluate image
                const result = qualityModel.evaluateImage(tempFilePath);
                
                // Clean up temp file
                fs.unlink(tempFilePath, (err) => {
                    if (err) console.error('Error deleting temp file:', err);
                });
                
                // Return result
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                
            } catch (error) {
                console.error('Error processing request:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error: ' + error.message }));
            }
        });
    } 
    else if (contentType.includes('multipart/form-data')) {
        // Handle multipart form data (for future implementation)
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Multipart form data not yet supported' }));
    }
    else {
        // Handle binary image data
        const chunks = [];
        
        req.on('data', chunk => {
            chunks.push(chunk);
        });
        
        req.on('end', () => {
            try {
                // Combine chunks into a single buffer
                const imageBuffer = Buffer.concat(chunks);
                
                // Save to temp file
                const tempFilePath = path.join(TEMP_DIR, `image-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.jpg`);
                fs.writeFileSync(tempFilePath, imageBuffer);
                
                // Evaluate image
                const result = qualityModel.evaluateImage(tempFilePath);
                
                // Clean up temp file
                fs.unlink(tempFilePath, (err) => {
                    if (err) console.error('Error deleting temp file:', err);
                });
                
                // Return result
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                
            } catch (error) {
                console.error('Error processing request:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error: ' + error.message }));
            }
        });
    }
}

// Start server
server.listen(PORT, () => {
    console.log(`Image Quality MCP server running at http://localhost:${PORT}`);
    console.log(`Endpoints:`);
    console.log(`  GET  / - Server info`);
    console.log(`  POST /evaluate-image - Evaluate image quality`);
});
