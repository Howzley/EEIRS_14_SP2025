"use client";

import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // only run on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // during SSR (or until useEffect fires) render children with no theme wrapper
  if (!mounted) {
    return <>{children}</>;
  }

  // once mounted, wrap in ThemeProvider so it can safely manipulate <html>
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </ThemeProvider>
  );
}
