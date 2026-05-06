"use client";

import { useEffect, useRef } from "react";

interface HCaptchaProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    hcaptcha: any;
  }
}

const HCaptcha = ({ onVerify, onError, onExpire }: HCaptchaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    // Load hCaptcha script
    const script = document.createElement("script");
    script.src = "https://js.hcaptcha.com/1/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (containerRef.current && window.hcaptcha) {
        // Render hCaptcha widget
        widgetId.current = window.hcaptcha.render(containerRef.current, {
          sitekey:
            process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ||
            "10000000-ffff-ffff-ffff-000000000001", // Demo/test key
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
      if (widgetId.current && window.hcaptcha) {
        window.hcaptcha.remove(widgetId.current);
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

export default HCaptcha;
