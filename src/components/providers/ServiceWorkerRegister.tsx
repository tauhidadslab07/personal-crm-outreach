'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Nexus CRM ServiceWorker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('Nexus CRM ServiceWorker registration failed:', error);
        });
    }
  }, []);

  return null;
}
