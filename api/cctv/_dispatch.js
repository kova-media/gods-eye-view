import { cctvProxy } from '../../server/providers/cctv.js';

let dispatch;

function getDispatcher() {
  if (dispatch) return dispatch;
  let middleware;
  cctvProxy({ sourceRoot: process.cwd() }).configureServer({
    httpServer: null,
    middlewares: {
      use(prefix, handler) {
        if (prefix === '/api/cctv') middleware = handler;
      },
    },
  });
  if (typeof middleware !== 'function') throw new Error('CCTV middleware failed to initialize');
  dispatch = middleware;
  return dispatch;
}

export async function dispatchCctv(req, res) {
  const url = new URL(req.url || '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/cctv/')) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }
  req.url = url.pathname.slice('/api/cctv'.length) + url.search;
  try {
    await getDispatcher()(req, res);
  } catch {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
    }
    if (!res.writableEnded) res.end(JSON.stringify({ error: 'Camera service unavailable' }));
  }
}
