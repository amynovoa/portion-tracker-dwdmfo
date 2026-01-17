
import { Platform } from "react-native";
import Constants from "expo-constants";

const FLUSH_INTERVAL = 5000;

let logQueue: { level: string; message: string; source: string; timestamp: string; platform: string }[] = [];

function clearLogAfterDelay(logKey: string) {
  setTimeout(() => {
    console.log(`Cleared log: ${logKey}`);
  }, 10000);
}

function getPlatformName(): string {
  return Platform.OS;
}

function getLogServerUrl(): string {
  const devServerUrl = Constants.expoConfig?.hostUri;
  if (devServerUrl) {
    const baseUrl = devServerUrl.split(':').slice(0, -1).join(':');
    return `http://${baseUrl}:3000`;
  }
  return 'http://localhost:3000';
}

function flushLogs() {
  if (logQueue.length === 0) return;

  const logsToSend = [...logQueue];
  logQueue = [];

  const serverUrl = getLogServerUrl();
  fetch(`${serverUrl}/api/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logs: logsToSend }),
  }).catch((error) => {
    console.error('Failed to send logs to server:', error);
  });
}

setInterval(flushLogs, FLUSH_INTERVAL);

function queueLog(level: string, message: string, source: string) {
  logQueue.push({
    level,
    message,
    source,
    timestamp: new Date().toISOString(),
    platform: getPlatformName(),
  });
}

export function sendErrorToParent(level: string, message: string, data: any) {
  const logKey = `${level}-${Date.now()}`;
  
  try {
    const caller = getCallerInfo();
    queueLog(level, message, caller);
    
    clearLogAfterDelay(logKey);
  } catch (error) {
    console.error('Error in sendErrorToParent:', error);
  }
}

function extractSourceLocation(stack: string): string {
  const lines = stack.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('at ') && !line.includes('errorLogger')) {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
      if (match) {
        const [, functionName, file, lineNum, col] = match;
        return `${functionName} (${file}:${lineNum}:${col})`;
      }
      const simpleMatch = line.match(/at\s+(.+?):(\d+):(\d+)/);
      if (simpleMatch) {
        const [, file, lineNum, col] = simpleMatch;
        return `${file}:${lineNum}:${col}`;
      }
    }
  }
  return 'unknown';
}

function getCallerInfo(): string {
  try {
    const stack = new Error().stack || '';
    return extractSourceLocation(stack);
  } catch {
    return 'unknown';
  }
}

function stringifyArgs(args: any[]): string {
  return args
    .map((arg) => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(' ');
}

const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
};

console.log = (...args: any[]) => {
  originalConsole.log(...args);
  sendErrorToParent('log', stringifyArgs(args), args);
};

console.warn = (...args: any[]) => {
  originalConsole.warn(...args);
  sendErrorToParent('warn', stringifyArgs(args), args);
};

console.error = (...args: any[]) => {
  originalConsole.error(...args);
  sendErrorToParent('error', stringifyArgs(args), args);
};

console.info = (...args: any[]) => {
  originalConsole.info(...args);
  sendErrorToParent('info', stringifyArgs(args), args);
};
