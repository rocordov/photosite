#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

class WeatherServer {
  constructor() {
    this.server = new Server(
      {
        name: 'example-weather-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
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
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'get_weather') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      const city = request.params.arguments.city;
      
      // Mock weather data (no actual API call)
      const mockWeatherData = {
        city: city,
        temperature: 22,
        conditions: 'Sunny',
        humidity: 65,
        wind_speed: 10,
        timestamp: new Date().toISOString()
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockWeatherData, null, 2),
          },
        ],
      };
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Weather MCP server running on stdio');
  }
}

const server = new WeatherServer();
server.run().catch(console.error);
