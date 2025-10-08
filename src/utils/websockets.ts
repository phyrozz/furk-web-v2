import { loginService } from "../services/auth/auth-service";

type Handler = (data: any) => void;
const WS_URL = import.meta.env.VITE_WEBSOCKET_URL as string;

let socket: WebSocket | null = null;
let connecting = false;
let connectedUsername: string | null = null;
const listeners = new Set<Handler>();
const queue: any[] = [];
let reconnectTimer: number | null = null;

async function connect(username: string) {
  // already open & same username -> nothing to do
  if (socket && socket.readyState === WebSocket.OPEN && connectedUsername === username) return;
  if (connecting) return; // another concurrent connect in progress

  connecting = true;
  try {
    // close previous if present (force cleanup)
    if (socket) {
      try { socket.close(); } catch {}
      socket = null;
      connectedUsername = null;
    }

    const url = `${WS_URL}?username=${encodeURIComponent(username)}`;
    socket = new WebSocket(url);
    connectedUsername = username;

    await new Promise<void>((resolve, reject) => {
      const onOpen = () => {
        cleanup();
        resolve();
      };
      const onError = (ev: Event) => {
        cleanup();
        reject(ev);
      };
      function cleanup() {
        if (!socket) return;
        socket.onopen = null;
        socket.onerror = null;
      }
      if (!socket) return reject(new Error("socket gone"));
      socket.onopen = onOpen;
      socket.onerror = onError;
    });

    // message distribution
    socket.onmessage = (ev) => {
      let parsed: any;
      try { parsed = JSON.parse(ev.data); } catch { return; }
      listeners.forEach((fn) => {
        try { fn(parsed); } catch (e) { console.error("ws listener error", e); }
      });
    };

    socket.onclose = () => {
      socket = null;
      connectedUsername = null;
      // try reconnect only if there are active listeners
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (listeners.size > 0) {
        reconnectTimer = window.setTimeout(async () => {
          try {
            const u = await loginService.getUsernameFromToken();
            if (u) await connect(u);
          } catch (e) {
            // ignore and attempt later
          }
        }, 3000);
      }
    };

    socket.onerror = (err) => {
      console.error("WS error:", err);
      // let onclose handle reconnect
      try { socket?.close(); } catch {}
    };

    // flush queued messages
    while (queue.length && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(queue.shift()));
    }
  } finally {
    connecting = false;
  }
}

/**
 * subscribe - registers a handler and ensures socket is connected.
 * returns an unregister function (async to ensure connect has run)
 */
export async function subscribe(handler: Handler) {
  listeners.add(handler);

  // connect if not connected
  const username = await loginService.getUsernameFromToken();
  if (username) {
    try {
      await connect(username);
    } catch (e) {
      // silent fail; reconnect logic will try
      console.warn("WS connect error on subscribe", e);
    }
  }

  // return unsubscribe
  return () => {
    listeners.delete(handler);
    // if no listeners left, close socket to free resources
    if (listeners.size === 0 && socket) {
      try { socket.close(); } catch {}
      socket = null;
      connectedUsername = null;
      if (reconnectTimer) { window.clearTimeout(reconnectTimer); reconnectTimer = null; }
    }
  };
}

/** send - ensures connection and sends. it queues if not open yet */
export async function send(payload: any) {
  const username = await loginService.getUsernameFromToken();
  if (!username) throw new Error("Not authenticated");

  await connect(username);

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  } else {
    // queue until socket opens
    queue.push(payload);
  }
}

export function isOpen() {
  return !!(socket && socket.readyState === WebSocket.OPEN);
}
