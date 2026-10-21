(function (Aureon) {
  'use strict';

  const handlers = new Map();

  function on(event, handler) {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event).add(handler);
    return () => handlers.get(event).delete(handler);
  }

  function emit(event, payload) {
    (handlers.get(event) || []).forEach((handler) => handler(payload));
  }

  Aureon.events = Object.freeze({ on, emit });
})(window.Aureon);
