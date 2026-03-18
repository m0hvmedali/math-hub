/**
 * Core Dynamic Script Loader for Google Services
 * Ensures scripts are only injected into the DOM once and returns a Promise.
 */

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

let gisPromise: Promise<void> | null = null;
let gapiPromise: Promise<void> | null = null;

export const loadGis = (): Promise<void> => {
  if (gisPromise) return gisPromise;

  gisPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.accounts) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.body.appendChild(script);
  });

  return gisPromise;
};

export const loadGapi = (): Promise<void> => {
  if (gapiPromise) return gapiPromise;

  gapiPromise = new Promise((resolve, reject) => {
    if (window.gapi) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Initialize empty client
      window.gapi.load('client', () => resolve());
    };
    script.onerror = () => reject(new Error('Failed to load Google API Client Library'));
    document.body.appendChild(script);
  });

  return gapiPromise;
};
