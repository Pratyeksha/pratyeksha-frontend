// The 3D viewer (~0.5 MB plus a WebGL context) is fetched only when a guest first opens a 3D dish, or a shared dish link.
const MODEL_VIEWER_SRC = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
let pending = null;
export const ensureModelViewer = () => {
  if (typeof window === 'undefined' || window.customElements?.get('model-viewer')) return Promise.resolve();
  if (pending) return pending;
  pending = new Promise((resolve) => {
    const s = document.createElement('script');
    s.type = 'module'; s.src = MODEL_VIEWER_SRC; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { pending = null; resolve(); };
    document.head.appendChild(s);
  });
  return pending;
};
