"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface EmailViewerProps {
  subject: string | null;
  fromAddress: string | null;
  receivedAt: string | null;
  emailBody: string | null;
  emailBodyHtml: string | null;
  attachmentCount: number;
}

export function EmailViewer({
  subject,
  fromAddress,
  receivedAt,
  emailBody,
  emailBodyHtml,
  attachmentCount,
}: EmailViewerProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-gray-600" />
          {t("email.originalEmail")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email header */}
        <div className="rounded-md bg-gray-50 p-3 text-sm">
          <div>
            <span className="text-gray-500">{t("email.from")}</span>{" "}
            <span className="font-medium">{fromAddress || "-"}</span>
          </div>
          <div>
            <span className="text-gray-500">{t("email.date")}</span>{" "}
            {receivedAt
              ? new Date(receivedAt).toLocaleString("nl-NL")
              : "-"}
          </div>
          <div>
            <span className="text-gray-500">{t("email.subject")}</span>{" "}
            <span className="font-medium">{subject || "-"}</span>
          </div>
          {attachmentCount > 0 && (
            <div>
              <span className="text-gray-500">{t("email.attachments")}</span>{" "}
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {attachmentCount} {attachmentCount !== 1 ? t("email.files") : t("email.file")}
              </span>
            </div>
          )}
        </div>

        {/* Email body */}
        {emailBodyHtml ? (
          <div
            className="prose prose-sm max-w-none rounded-md border p-4"
            dangerouslySetInnerHTML={{ __html: emailBodyHtml }}
          />
        ) : emailBody ? (
          <pre className="whitespace-pre-wrap rounded-md border bg-gray-50 p-4 text-sm">
            {emailBody}
          </pre>
        ) : (
          <p className="text-sm text-gray-500">{t("email.noBody")}</p>
        )}
      </CardContent>
    </Card>
  );
}
