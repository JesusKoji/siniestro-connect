import { useEffect, useState } from "react";

function isIPadDevice() {
  const ua = navigator.userAgent;
  return /iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isPhoneDevice() {
  const ua = navigator.userAgent;
  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

export function useIsMobileDevice() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      const ipad = isIPadDevice();
      const phone = isPhoneDevice();
      const narrow = window.innerWidth < 900;
      setIsMobile(phone || (!ipad && narrow));
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}
