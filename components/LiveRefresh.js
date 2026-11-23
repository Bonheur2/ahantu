"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-fetches the server component data every few seconds.
export default function LiveRefresh({ ms = 3000 }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, ms);
    return () => clearInterval(t);
  }, [router, ms]);
  return null;
}
