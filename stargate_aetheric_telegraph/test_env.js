const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('Testing dependencies in verify.js...');
try {
  const puppeteer = require('puppeteer');
  console.log('Puppeteer successfully loaded!');
} catch (err) {
  console.log('Puppeteer load error:', err.message);
}
