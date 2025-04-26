#!/usr/bin/env node

const http = require('http');

// Function to make HTTP requests to our MCP server
async function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3030,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Main function to run our tests
async function runTests() {
  try {
    console.log('🧪 Testing MCP Server...');

    // Test 1: List available tools
    console.log('\n🔍 Test 1: Listing available tools');
    const toolsResponse = await makeRequest('/tools');
    console.log(`Found ${toolsResponse.tools.length} tools:`);
    toolsResponse.tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });

    // Test 2: Call get_weather tool
    console.log('\n🔍 Test 2: Calling get_weather tool');
    const weatherResponse = await makeRequest('/call', 'POST', {
      name: 'get_weather',
      arguments: {
        city: 'Seattle'
      }
    });
    console.log('Weather data:');
    console.log(weatherResponse.content[0].text);

    // Test 3: Call get_time tool
    console.log('\n🔍 Test 3: Calling get_time tool');
    const timeResponse = await makeRequest('/call', 'POST', {
      name: 'get_time',
      arguments: {
        location: 'New York'
      }
    });
    console.log('Time data:');
    console.log(timeResponse.content[0].text);

    // Test 4: List available resources
    console.log('\n🔍 Test 4: Listing available resources');
    const resourcesResponse = await makeRequest('/resources');
    console.log(`Found ${resourcesResponse.resources.length} resources:`);
    resourcesResponse.resources.forEach(resource => {
      console.log(`- ${resource.name} (${resource.uri})`);
    });

    // Test 5: Access a resource
    console.log('\n🔍 Test 5: Accessing a resource');
    const resourceResponse = await makeRequest('/resource', 'POST', {
      uri: 'weather://Phoenix/current'
    });
    console.log('Resource data:');
    console.log(resourceResponse.contents[0].text);

    // Test 6: Error handling - call unknown tool
    console.log('\n🔍 Test 6: Error handling - calling unknown tool');
    try {
      await makeRequest('/call', 'POST', {
        name: 'unknown_tool',
        arguments: {}
      });
    } catch (error) {
      console.log('Expected error received:', error.message);
    }

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run our tests
runTests();
