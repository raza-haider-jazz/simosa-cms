"use client";

import { useEffect } from "react";

export function FullscreenWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger on 'F' key when not typing in an input/textarea
      if (
        e.key.toLowerCase() === "f" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target as HTMLElement)?.isContentEditable
      ) {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.log(`Fullscreen error: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return <>{children}</>;
}
