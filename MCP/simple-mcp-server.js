#!/usr/bin/env node

const http = require('http');

// Simple MCP-like server that provides a weather tool
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  
  // Parse URL path
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  // MCP-like endpoint structure
  if (path === '/tools') {
    // List available tools
    const tools = [
      {
        name: 'get_weather',
        description: 'Get current weather for a city',
        inputSchema: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: 'City name',
            },
          },
          required: ['city'],
        },
      },
      {
        name: 'get_time',
        description: 'Get current time for a location',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'Location name',
            },
          },
          required: ['location'],
        },
      }
    ];
    
    res.statusCode = 200;
    res.end(JSON.stringify({ tools }));
    return;
  } 
  else if (path === '/call') {
    // Handle tool calls
    let data = '';
    
    req.on('data', chunk => {
      data += chunk;
    });
    
    req.on('end', () => {
      try {
        const request = JSON.parse(data);
        const { name, arguments: args } = request;
        
        if (name === 'get_weather') {
          const city = args.city;
          
          // Mock weather data
          const weatherData = {
            city: city,
            temperature: Math.floor(Math.random() * 30) + 5, // Random temperature between 5-35°C
            conditions: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
            humidity: Math.floor(Math.random() * 50) + 30, // Random humidity between 30-80%
            timestamp: new Date().toISOString()
          };
          
          res.statusCode = 200;
          res.end(JSON.stringify({
            content: [
              {
                type: 'text',
                text: JSON.stringify(weatherData, null, 2),
              },
            ],
          }));
        } 
        else if (name === 'get_time') {
          const location = args.location;
          
          // Mock time data
          const timeData = {
            location: location,
            time: new Date().toISOString(),
            timezone: 'UTC'
          };
          
          res.statusCode = 200;
          res.end(JSON.stringify({
            content: [
              {
                type: 'text',
                text: JSON.stringify(timeData, null, 2),
              },
            ],
          }));
        } 
        else {
          res.statusCode = 400;
          res.end(JSON.stringify({
            error: {
              code: 'UNKNOWN_TOOL',
              message: `Unknown tool: ${name}`,
            },
          }));
        }
      } catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({
          error: {
            code: 'INVALID_REQUEST',
            message: err.message,
          },
        }));
      }
    });
    return;
  }
  else if (path === '/resources') {
    // List available resources
    const resources = [
      {
        uri: 'weather://Phoenix/current',
        name: 'Current weather in Phoenix',
        mimeType: 'application/json',
        description: 'Real-time weather data for Phoenix',
      }
    ];
    
    res.statusCode = 200;
    res.end(JSON.stringify({ resources }));
    return;
  }
  else if (path === '/resource') {
    // Handle resource access
    let data = '';
    
    req.on('data', chunk => {
      data += chunk;
    });
    
    req.on('end', () => {
      try {
        const request = JSON.parse(data);
        const { uri } = request;
        
        if (uri === 'weather://Phoenix/current') {
          // Mock Phoenix weather data
          const weatherData = {
            city: 'Phoenix',
            temperature: 35, // Phoenix is usually hot!
            conditions: 'Sunny',
            humidity: 25,
            timestamp: new Date().toISOString()
          };
          
          res.statusCode = 200;
          res.end(JSON.stringify({
            contents: [
              {
                uri: uri,
                mimeType: 'application/json',
                text: JSON.stringify(weatherData, null, 2),
              },
            ],
          }));
        } 
        else {
          res.statusCode = 404;
          res.end(JSON.stringify({
            error: {
              code: 'RESOURCE_NOT_FOUND',
              message: `Resource not found: ${uri}`,
            },
          }));
        }
      } catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({
          error: {
            code: 'INVALID_REQUEST',
            message: err.message,
          },
        }));
      }
    });
    return;
  }
  
  // Default response for unknown paths
  res.statusCode = 404;
  res.end(JSON.stringify({
    error: {
      code: 'NOT_FOUND',
      message: `Path not found: ${path}`,
    },
  }));
});

const PORT = 3030;
server.listen(PORT, () => {
  console.log(`MCP server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`- GET http://localhost:${PORT}/tools (List available tools)`);
  console.log(`- POST http://localhost:${PORT}/call (Call a tool)`);
  console.log(`- GET http://localhost:${PORT}/resources (List available resources)`);
  console.log(`- POST http://localhost:${PORT}/resource (Access a resource)`);
});
