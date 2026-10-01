import { useCallback, useEffect, useState } from 'react';

const CONFIGS = {
  customer: { manifest: '/customer-manifest.webmanifest', sw: '/sw.js', scope: '/' },
  operator: { manifest: '/operator-manifest.webmanifest', sw: '/operator-sw.js', scope: '/operator' },
  kitchen: { manifest: '/kitchen-manifest.webmanifest', sw: '/kitchen-sw.js', scope: '/kitchen' },
};

let deferredInstallPrompt = null;
const installListeners = new Set();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', event => {
    // Always defer the native prompt. The app exposes an explicit Install
    // action from the fixed sidebar/footer instead of allowing Chrome to
    // show an unsolicited mini-infobar/banner.
    event.preventDefault();
    deferredInstallPrompt = event;
    installListeners.forEach(listener => listener(true));
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installListeners.forEach(listener => listener(false));
  });
}

export const getPwaConfig = kind => CONFIGS[kind] || CONFIGS.customer;

export const configurePwa = kind => {
  if (typeof window === 'undefined') return;
  const config = getPwaConfig(kind);
  let manifest = document.querySelector('link[data-pratyeksha-manifest]');
  if (!manifest) {
    manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.dataset.pratyekshaManifest = 'true';
    document.head.appendChild(manifest);
  }
  manifest.href = config.manifest;

  let theme = document.querySelector('meta[name="theme-color"]');
  if (!theme) {
    theme = document.createElement('meta');
    theme.name = 'theme-color';
    document.head.appendChild(theme);
  }
  theme.content = kind === 'kitchen' ? '#f7f3eb' : '#0e0e0e';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(config.sw, { scope: config.scope }).catch(() => {});
  }
};

export function usePwaInstall(kind) {
  const [canInstall, setCanInstall] = useState(() => !!deferredInstallPrompt);
  const [installed, setInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(display-mode: standalone)')?.matches === true || window.navigator.standalone === true;
  });

  useEffect(() => {
    configurePwa(kind);
    const listener = value => setCanInstall(value);
    installListeners.add(listener);
    return () => installListeners.delete(listener);
  }, [kind]);

  const promptInstall = useCallback(async () => {
    if (!deferredInstallPrompt) return 'unavailable';
    const prompt = deferredInstallPrompt;
    deferredInstallPrompt = null;
    setCanInstall(false);
    try {
      await prompt.prompt();
    } catch {
      return 'unavailable';
    }
    const choice = await prompt.userChoice;
    if (choice?.outcome === 'accepted') setInstalled(true);
    return choice?.outcome || 'dismissed';
  }, []);

  return { canInstall, installed, promptInstall };
}

export function isIosInstallable() {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.navigator.standalone;
}
