"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
export default function SettingsPage() {
  const { t } = useTranslation();
  const [showKey, setShowKey] = useState(false);
  const apiKeyPlaceholder = "Configure INGEST_API_KEY in .env";

  function copyEndpoint() {
    const url = `${window.location.origin}/api/ingest/email`;
    navigator.clipboard.writeText(url);
    toast.success(t("settings.copied"));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("settings.title")}</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.paIntegration")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("settings.apiEndpoint")}</label>
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
            <label className="text-sm font-medium">{t("settings.apiKey")}</label>
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
              {t("settings.apiKeyHelp")}
            </p>
          </div>

          <div className="rounded-md bg-gray-50 p-4">
            <h4 className="text-sm font-medium mb-2">{t("settings.paSetup")}</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>{t("settings.paStep1")}</li>
              <li>{t("settings.paStep2")}</li>
              <li>{t("settings.paStep3")}</li>
              <li>{t("settings.paStep4")}</li>
              <li>{t("settings.paStep5")}</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
