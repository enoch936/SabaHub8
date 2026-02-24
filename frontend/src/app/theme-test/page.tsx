"use client";

import { useEffect, useState } from "react";
import { SegmentedThemeToggle, useTheme } from "@/components/useTheme";

export default function ThemeTestPage() {
  const { theme, mounted } = useTheme();
  const [htmlClasses, setHtmlClasses] = useState<string>("");
  const [storedTheme, setStoredTheme] = useState<string>("");

  useEffect(() => {
    if (!mounted) return;

    const checkState = () => {
      const html = document.documentElement;
      const classes = html.className;
      const stored = window.localStorage.getItem("sabahub-theme") || "not set";

      setHtmlClasses(classes);
      setStoredTheme(stored);
    };

    checkState();

    // Check every 500ms to catch changes
    const interval = setInterval(checkState, 500);

    return () => clearInterval(interval);
  }, [mounted]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-black dark:text-white transition-colors">
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold">Theme Debug Test</h1>

        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border-2 border-sky-500 space-y-2">
          <div>
            <strong>Current Hook Theme:</strong> <code className="bg-white dark:bg-slate-700 px-2 py-1 rounded">{mounted ? theme : "loading..."}</code>
          </div>
          <div>
            <strong>HTML Classes:</strong> <code className="bg-white dark:bg-slate-700 px-2 py-1 rounded">{htmlClasses || "none"}</code>
          </div>
          <div>
            <strong>LocalStorage sabahub-theme:</strong> <code className="bg-white dark:bg-slate-700 px-2 py-1 rounded">{storedTheme}</code>
          </div>
          <div>
            <strong>color-scheme:</strong> <code className="bg-white dark:bg-slate-700 px-2 py-1 rounded">{document.documentElement.style.colorScheme}</code>
          </div>
        </div>

        <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-6">
          <h2 className="text-xl font-semibold mb-4">Test the Toggle</h2>
          {mounted && <SegmentedThemeToggle />}
        </div>

        <div className="mt-8 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <p className="text-sm">
            This page demonstrates the theme system. Click the toggle above and check:
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>The background color changes instantly</li>
              <li>The HTML classes update (should show "light" or "dark")</li>
              <li>LocalStorage updates</li>
              <li>Refresh the pacdge - theme should persist</li>
            </ul>
          </p>
        </div>

        {!mounted && <div className="text-yellow-600 dark:text-yellow-400">Loading theme system...</div>}
      </div>
    </div>
  );
}
