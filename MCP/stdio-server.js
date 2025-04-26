#!/usr/bin/env node

const https = require("https");
const { URL } = require("url");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4";

// LSP message framing
let buffer = "";
let contentLength = null;

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  while (true) {
    if (contentLength === null) {
      const match = buffer.match(/Content-Length: (\d+)\r\n\r\n/);
      if (!match) break;
      contentLength = parseInt(match[1], 10);
      buffer = buffer.slice(match.index + match[0].length);
    }
    if (buffer.length < contentLength) break;
    const message = buffer.slice(0, contentLength);
    buffer = buffer.slice(contentLength);
    contentLength = null;
    handleMessage(message);
  }
});

function sendLSPResponse(obj, id = null, method = null) {
  let response = {};
  response.jsonrpc = "2.0"; // Ensure LSP compliance
  if (id !== null) {
    response.id = id;
  }
  if (method) {
    response.method = method;
  }
  if (obj.result !== undefined || obj.error !== undefined) {
    Object.assign(response, obj);
  } else {
    response = { ...response, ...obj };
  }
  const json = JSON.stringify(response);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`);
}

function handleMessage(message) {
  let msg;
  try {
    msg = JSON.parse(message);
  } catch (err) {
    sendLSPResponse({ error: { code: -32700, message: "Parse error", data: message } });
    return;
  }

  // LSP: method-based dispatch
  if (msg.method === "initialize") {
    sendLSPResponse({ result: {
      capabilities: {}, // LSP requires a capabilities object
      message: "MCP Stdio Server ready!"
    } }, msg.id);
  } else if (msg.method === "prompt" || msg.type === "prompt") {
    if (!OPENROUTER_API_KEY) {
      sendLSPResponse({ error: { code: 1, message: "Missing OPENROUTER_API_KEY in environment" } }, msg.id);
      return;
    }
    const payload = JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: msg.text || msg.params?.text }],
    });

    const url = new URL(OPENROUTER_ENDPOINT);
    const options = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-app.com",
        "X-Title": "stdio-server",
      }
    };

    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const reply = parsed.choices?.[0]?.message?.content || "No response";
          sendLSPResponse({ result: { content: reply } }, msg.id);
        } catch (err) {
          sendLSPResponse({ error: { code: 2, message: "Failed to parse OpenRouter response", data } }, msg.id);
        }
      });
    });

    req.on("error", (err) => {
      sendLSPResponse({ error: { code: 3, message: "OpenRouter API request failed", data: err.message } }, msg.id);
    });

    req.write(payload);
    req.end();
  } else {
    sendLSPResponse({ error: { code: -32601, message: "Unknown method", data: msg } }, msg.id);
  }
}