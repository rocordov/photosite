#!/usr/bin/env node
// Minimal LSP client to test stdio-server.js
const { spawn } = require('child_process');

const child = spawn('node', ['MCP/stdio-server.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// LSP initialize request
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    processId: process.pid,
    rootUri: null,
    capabilities: {}
  }
};
const json = JSON.stringify(request);
const message = `Content-Length: ${Buffer.byteLength(json, 'utf8')}` + "\r\n\r\n" + json;

child.stdout.on('data', (data) => {
  process.stdout.write('[server] ' + data.toString());
});

child.stdin.write(message);

// End after 2 seconds
setTimeout(() => {
  child.kill();
}, 2000);
