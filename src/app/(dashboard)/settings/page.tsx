"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [showKey, setShowKey] = useState(false);
  const apiKeyPlaceholder = "Configure INGEST_API_KEY in .env";

  function copyEndpoint() {
    const url = `${window.location.origin}/api/ingest/email`;
    navigator.clipboard.writeText(url);
    toast.success("Endpoint URL copied to clipboard");
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Power Automate Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">API Endpoint</label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/ingest/email`}
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={copyEndpoint}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <div className="flex gap-2">
              <Input
                readOnly
                type={showKey ? "text" : "password"}
                value={apiKeyPlaceholder}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              The API key is configured via the INGEST_API_KEY environment variable.
            </p>
          </div>

          <div className="rounded-md bg-gray-50 p-4">
            <h4 className="text-sm font-medium mb-2">Power Automate Setup</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Create a new flow triggered by incoming email from KCB</li>
              <li>Add an HTTP action with POST method to the API endpoint above</li>
              <li>Set header <code className="bg-gray-200 px-1 rounded">X-API-Key</code> to your API key</li>
              <li>Set the body to include subject, from, receivedDateTime, and attachments</li>
              <li>Map email attachments to the contentBytes field (base64)</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
