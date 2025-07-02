/// <reference types="vite/client" />

// Extend the Window interface to include Leaflet
interface Window {
  L: typeof import('leaflet');
}