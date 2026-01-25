"use client";

import { useEffect, useState } from "react";
import { bootstrapSession } from "@/lib/session";
import { api } from "@/lib/api";

export default function TestAuthPage() {
  const [token, setToken] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    bootstrapSession();
    const storedToken = localStorage.getItem("auth_token");
    setToken(storedToken);
  }, []);

  const testSaveSettings = async () => {
    setLoading(true);
    setTestResult("Testing...");
    
    try {
      const response = await api.patch("/user/settings", {
        bio: "Test bio from test page - " + new Date().toISOString()
      });
      
      setTestResult("✅ SUCCESS! Settings saved: " + JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      const errorMsg = error?.response?.data || error?.message || "Unknown error";
      setTestResult("❌ FAILED: " + JSON.stringify(errorMsg, null, 2));
      console.error("Full error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication & Settings Test</h1>
      
      <div className="space-y-4">
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Token Status:</h2>
          {token ? (
            <div>
              <p className="text-green-600">✅ Token exists</p>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 mt-2 overflow-x-auto rounded">
                {token.substring(0, 100)}...
              </pre>
              <p className="text-xs text-gray-500 mt-1">
                Contains "mock-signature-for-development": {token.includes("mock-signature-for-development") ? "✅ Yes" : "❌ No"}
              </p>
            </div>
          ) : (
            <p className="text-red-600">❌ No token found - reload page</p>
          )}
        </div>

        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Test Settings Save:</h2>
          <button
            onClick={testSaveSettings}
            disabled={loading || !token}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test PATCH /api/user/settings"}
          </button>
          
          {testResult && (
            <pre className="mt-4 text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto whitespace-pre-wrap">
              {testResult}
            </pre>
          )}
        </div>

        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Check that token exists above</li>
            <li>Click "Test PATCH /api/user/settings" button</li>
            <li>If you see ✅ SUCCESS, the system is working</li>
            <li>If you see ❌ FAILED, check the browser console for details</li>
            <li>Go to <a href="/dashboard/settings" className="text-blue-600 underline">/dashboard/settings</a> to test the real page</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
