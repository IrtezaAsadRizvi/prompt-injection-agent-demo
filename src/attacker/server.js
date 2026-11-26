// A pretend attacker server. Logs every request it receives. Binds to 127.0.0.1 only.
import { createServer } from 'node:http';

const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'); // 1x1 gif

export const log = []; // decoded path + query of every hit
export const resetLog = () => { log.length = 0; };
let server;

// Starts on a random free port. Returns the base URL.
export async function start() {
  server = createServer((req, res) => {
    log.push(decodeURIComponent(req.url));
    res.writeHead(200, { 'Content-Type': 'image/gif' });
    res.end(PIXEL);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

export async function stop() {
  if (!server) return;
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  server = undefined;
}
