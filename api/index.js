'use strict';

// Vercel serverless entry that forwards to the compiled Express handler
// Ensure the TypeScript build outputs dist/index.js
const compiled = require('../dist/index.js');
const handler = compiled && compiled.default ? compiled.default : compiled;

module.exports = handler;

