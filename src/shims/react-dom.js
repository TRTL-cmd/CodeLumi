// Shim: re-export ReactDOM from the CDN-loaded window global
// This prevents Vite from bundling a second copy of ReactDOM
const RD = window.ReactDOM;
export default RD;
export const {
  render, hydrate, createPortal, unmountComponentAtNode,
  findDOMNode, flushSync, createRoot, hydrateRoot
} = RD;
