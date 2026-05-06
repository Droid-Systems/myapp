"use client";

import { useEffect, useRef } from "react";

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile: any;
  }
}

const TurnstileCaptcha = ({
  onVerify,
  onError,
  onExpire,
}: TurnstileCaptchaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    // Load Turnstile script
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (containerRef.current && window.turnstile) {
        // Render Turnstile widget
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA", // Demo/test key
          callback: (token: string) => {
            onVerify(token);
          },
          "error-callback": () => {
            onError?.();
          },
          "expired-callback": () => {
            onExpire?.();
          },
          theme: "light",
          size: "normal",
        });
      }
    };

    return () => {
      // Cleanup
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onVerify, onError, onExpire]);

  return (
    <div className="mb-6">
      <label className="text-dark mb-3 block text-sm dark:text-white">
        Security Verification
      </label>
      <div ref={containerRef} className="flex justify-center"></div>
    </div>
  );
};

export default TurnstileCaptcha;
