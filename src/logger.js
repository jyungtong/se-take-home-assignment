'use strict';

const fs = require('fs');
const path = require('path');

const RESULT_FILE = path.join(__dirname, '..', 'scripts', 'result.txt');

let writeStream = null;

function timestamp() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `[${hh}:${mm}:${ss}]`;
}

function initResultFile(header) {
  writeStream = fs.createWriteStream(RESULT_FILE, { flags: 'w' });
  if (header) {
    writeStream.write(header + '\n\n');
  }
}

function log(message) {
  const line = `${timestamp()} ${message}`;
  console.log(line);
  if (writeStream) {
    writeStream.write(line + '\n');
  }
}

function write(message) {
  console.log(message);
  if (writeStream) {
    writeStream.write(message + '\n');
  }
}

function closeResultFile() {
  return new Promise((resolve) => {
    if (writeStream) {
      writeStream.end(resolve);
    } else {
      resolve();
    }
  });
}

module.exports = { initResultFile, log, write, closeResultFile };
