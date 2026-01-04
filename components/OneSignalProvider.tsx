"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    OneSignal?: any;
  }
}

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || process.env.ONESIGNAL_APP_ID;

export default function OneSignalProvider() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (!ONESIGNAL_APP_ID) {
      console.warn('OneSignal: APP_ID not configured');
      return;
    }

    initialized.current = true;

    const existingScript = document.querySelector('script[src*="OneSignalSDK"]');
    if (existingScript) {
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    window.OneSignalDeferred.push(async function(OneSignal: any) {
      try {
        if (OneSignal.initialized) {
          console.log('OneSignal already initialized');
          return;
        }

        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false,
          },
        });

        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          OneSignal.Slidedown.promptPush();
        }
      } catch (error) {
        console.error('OneSignal initialization error:', error);
      }
    });

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
}
