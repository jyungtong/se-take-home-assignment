import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULT_FILE = path.join(__dirname, '..', 'scripts', 'result.txt');

let writeStream: fs.WriteStream | null = null;

function timestamp(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `[${hh}:${mm}:${ss}]`;
}

export interface Logger {
  initResultFile(header?: string): void;
  log(message: string): void;
  write(message: string): void;
  closeResultFile(): Promise<void>;
}

const logger: Logger = {
  initResultFile(header?: string): void {
    writeStream = fs.createWriteStream(RESULT_FILE, { flags: 'w' });
    if (header) {
      writeStream.write(header + '\n\n');
    }
  },

  log(message: string): void {
    const line = `${timestamp()} ${message}`;
    console.log(line);
    if (writeStream) {
      writeStream.write(line + '\n');
    }
  },

  write(message: string): void {
    console.log(message);
    if (writeStream) {
      writeStream.write(message + '\n');
    }
  },

  closeResultFile(): Promise<void> {
    return new Promise((resolve) => {
      if (writeStream) {
        writeStream.end(resolve);
      } else {
        resolve();
      }
    });
  },
};

export default logger;
