"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shipments/status-badge";
import { StatusTimeline } from "@/components/shipments/status-timeline";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ArrowLeft, FileText, AlertTriangle, FlaskConical, Mail, Paperclip, FileDown } from "lucide-react";

interface ShipmentDetail {
  id: string;
  aangiftenummer: string;
  aangever: string | null;
  relatienaam: string | null;
  referentie: string | null;
  exporteur: string | null;
  importeur: string | null;
  awb: string | null;
  landVanOorsprong: string | null;
  landVanVerzending: string | null;
  transportNaarEU: string | null;
  inspectielocatie: string | null;
  inspectiedatum: string | null;
  verwachteAankomst: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  subShipments: Array<{
    id: string;
    botanischeNaam: string;
    landVanOorsprong: string | null;
    aantalColli: number | null;
    soortColli: string | null;
    aantalStuks: number | null;
    taricCode: string | null;
  }>;
  inspectionReports: Array<{
    id: string;
    rapportnummer: string;
    rapportdatum: string | null;
    inspecteur: string | null;
    resultaten: string | null;
  }>;
  sampleReports: Array<{
    id: string;
    dossiernummer: string;
    product: string | null;
    monsternummer: string | null;
    soortMonster: string | null;
    vermoedenOorzaak: string | null;
    diagnose: string | null;
  }>;
  blockadeReports: Array<{
    id: string;
    dossiernummer: string;
    reden: string | null;
    varieteit: string | null;
    monsternummer: string | null;
  }>;
  statusHistory: Array<{
    id: string;
    status: string;
    source: string | null;
    details: string | null;
    timestamp: string;
  }>;
  emailIngestion: {
    id: string;
    subject: string | null;
    fromAddress: string | null;
    receivedAt: string | null;
    emailBody: string | null;
    emailBodyHtml: string | null;
    attachmentCount: number;
  } | null;
}

interface EmailSheetDetail {
  id: string;
  subject: string | null;
  fromAddress: string | null;
  receivedAt: string | null;
  processedAt: string;
  status: string;
  errors: string | null;
  emailBody: string | null;
  emailBodyHtml: string | null;
  attachments: { name: string; contentType?: string; index: number }[];
  shipments: { id: string; aangiftenummer: string; awb: string | null; status: string }[];
}

export default function ShipmentDetailPage() {
  const params = useParams();
  const { t } = useTranslation();
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailSheet, setEmailSheet] = useState<EmailSheetDetail | null>(null);
  const [emailSheetOpen, setEmailSheetOpen] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/shipments/${params.id}`)
        .then((res) => res.json())
        .then(setShipment)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  async function openEmailDetail(emailId: string) {
    setLoadingEmail(true);
    setEmailSheetOpen(true);
    const res = await fetch(`/api/email-ingestions/${emailId}`);
    if (res.ok) {
      setEmailSheet(await res.json());
    }
    setLoadingEmail(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (!shipment) {
    return <div className="text-gray-500">{t("shipments.notFound")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/shipments"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("shipments.backToShipments")}
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold font-mono">{shipment.aangiftenummer}</h2>
          <p className="text-gray-500">{shipment.exporteur}</p>
        </div>
        <StatusBadge status={shipment.status} />
      </div>

      {/* Key Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(() => {
          const isConfirmed = ["INSPECTIE_GEPLAND", "DOCUMENTCONTROLE", "DOCUMENTCONTROLE_AFGEROND", "FYSIEKE_INSPECTIE", "GOEDGEKEURD", "WACHT_OP_VERVOLG", "GEBLOKKEERD"].includes(shipment.status);
          const dateLabel = isConfirmed ? t("detail.scheduledDate") : t("detail.requestedDate");
          return (
            <Card className={!isConfirmed && shipment.inspectiedatum ? "border-amber-300 bg-amber-50/50" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{t("detail.inspection")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {!isConfirmed && shipment.inspectiedatum && (
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {t("detail.inspectionRequested")}
                  </div>
                )}
                {isConfirmed && shipment.inspectiedatum && (
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {t("detail.inspectionConfirmed")}
                  </div>
                )}
                <div><span className="text-gray-500">{dateLabel}</span>{" "}
                  {shipment.inspectiedatum
                    ? new Date(shipment.inspectiedatum).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" })
                    : "-"}
                </div>
                <div><span className="text-gray-500">{t("detail.location")}</span> {shipment.inspectielocatie ? shipment.inspectielocatie.substring(0, 40) : "-"}</div>
                <div><span className="text-gray-500">{t("detail.reference")}</span> {shipment.referentie || "-"}</div>
              </CardContent>
            </Card>
          );
        })()}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t("detail.transport")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><span className="text-gray-500">{t("detail.awb")}</span> <span className="font-mono">{shipment.awb || "-"}</span></div>
            <div><span className="text-gray-500">{t("detail.origin")}</span> {shipment.landVanOorsprong || "-"}</div>
            <div><span className="text-gray-500">{t("detail.transportLabel")}</span> {shipment.transportNaarEU || "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t("detail.parties")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><span className="text-gray-500">{t("detail.declarant")}</span> {shipment.aangever || "-"}</div>
            <div><span className="text-gray-500">{t("detail.relation")}</span> {shipment.relatienaam || "-"}</div>
            <div><span className="text-gray-500">{t("detail.importer")}</span> {shipment.importeur || "-"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-shipments */}
      {shipment.subShipments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("detail.subShipments")} ({shipment.subShipments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.product")}</TableHead>
                  <TableHead>{t("table.origin")}</TableHead>
                  <TableHead className="text-right">{t("detail.colli")}</TableHead>
                  <TableHead>{t("detail.type")}</TableHead>
                  <TableHead className="text-right">{t("detail.pieces")}</TableHead>
                  <TableHead>{t("detail.taric")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipment.subShipments.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.botanischeNaam}</TableCell>
                    <TableCell>{sub.landVanOorsprong || "-"}</TableCell>
                    <TableCell className="text-right">{sub.aantalColli ?? "-"}</TableCell>
                    <TableCell>{sub.soortColli || "-"}</TableCell>
                    <TableCell className="text-right">
                      {sub.aantalStuks?.toLocaleString() ?? "-"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{sub.taricCode || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Reports */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Inspection Reports */}
        {shipment.inspectionReports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                {t("detail.inspectionReports")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {shipment.inspectionReports.map((report) => {
                let resultaten: Array<{ gewas: string; status: string }> = [];
                try {
                  if (report.resultaten) resultaten = JSON.parse(report.resultaten);
                } catch { /* empty */ }
                return (
                  <div key={report.id} className="rounded-md border p-3">
                    <div className="font-mono text-sm font-medium">{report.rapportnummer}</div>
                    <div className="text-sm text-gray-500">
                      {report.rapportdatum
                        ? new Date(report.rapportdatum).toLocaleDateString("nl-NL", { timeZone: "UTC" })
                        : "-"}{" "}
                      {report.inspecteur && `- ${report.inspecteur}`}
                    </div>
                    {resultaten.map((r, i) => (
                      <div key={i} className="mt-1 text-sm">
                        {r.gewas}: <StatusBadge status={r.status === "Goedgekeurd" ? "GOEDGEKEURD" : r.status === "Wacht op vervolg" ? "WACHT_OP_VERVOLG" : "GEBLOKKEERD"} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Blockade Reports */}
        {shipment.blockadeReports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                {t("detail.blockadeReports")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {shipment.blockadeReports.map((report) => (
                <div key={report.id} className="rounded-md border border-red-200 bg-red-50 p-3">
                  <div className="font-mono text-sm font-medium">{report.dossiernummer}</div>
                  <div className="mt-1 text-sm text-red-700">{report.reden || t("detail.unknownReason")}</div>
                  {report.varieteit && (
                    <div className="mt-1 text-sm text-gray-500">{t("detail.variety")} {report.varieteit}</div>
                  )}
                  {report.monsternummer && (
                    <div className="text-sm text-gray-500">{t("detail.sample")} {report.monsternummer}</div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Sample Reports */}
        {shipment.sampleReports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FlaskConical className="h-4 w-4 text-orange-500" />
                {t("detail.sampleReports")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {shipment.sampleReports.map((report) => (
                <div key={report.id} className="rounded-md border border-orange-200 bg-orange-50 p-3">
                  <div className="font-mono text-sm font-medium">{report.dossiernummer}</div>
                  <div className="mt-1 text-sm">
                    {report.product && <span>{report.product} - </span>}
                    {report.soortMonster || ""}
                  </div>
                  {report.vermoedenOorzaak && (
                    <div className="text-sm text-orange-700">
                      {t("detail.suspect")} {report.vermoedenOorzaak}
                    </div>
                  )}
                  {report.diagnose && (
                    <div className="text-sm font-medium text-gray-700">
                      {t("detail.diagnosis")} {report.diagnose}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("detail.statusHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline
            history={shipment.statusHistory}
            onViewEmail={shipment.emailIngestion ? () => openEmailDetail(shipment.emailIngestion!.id) : undefined}
          />
        </CardContent>
      </Card>

      {/* Original Email */}
      {shipment.emailIngestion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-gray-600" />
              {t("email.originalEmail")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => openEmailDetail(shipment.emailIngestion!.id)}
              className="w-full rounded-md border bg-white p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{shipment.emailIngestion.subject || "-"}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {shipment.emailIngestion.fromAddress || "-"}
                    {shipment.emailIngestion.receivedAt && (
                      <> &middot; {new Date(shipment.emailIngestion.receivedAt).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" })}</>
                    )}
                  </div>
                </div>
                {shipment.emailIngestion.attachmentCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 shrink-0">
                    <Paperclip className="h-3 w-3" />
                    {shipment.emailIngestion.attachmentCount}
                  </span>
                )}
              </div>
            </button>
          </CardContent>
        </Card>
      )}
      {/* Email detail sheet */}
      <Sheet
        open={emailSheetOpen}
        onOpenChange={(open) => {
          setEmailSheetOpen(open);
          if (!open) setEmailSheet(null);
        }}
      >
        <SheetContent side="right" className="!w-[50vw] !max-w-[50vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t("email.originalEmail")}
            </SheetTitle>
            <SheetDescription>
              {emailSheet?.subject || ""}
            </SheetDescription>
          </SheetHeader>

          {loadingEmail ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : emailSheet ? (
            <div className="space-y-4 px-4 pb-4">
              {/* Email metadata */}
              <div className="rounded-md bg-gray-50 p-3 text-sm space-y-1">
                <div>
                  <span className="text-gray-500">{t("email.from")}</span>{" "}
                  <span className="font-medium">{emailSheet.fromAddress || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t("email.date")}</span>{" "}
                  {emailSheet.receivedAt
                    ? new Date(emailSheet.receivedAt).toLocaleString("nl-NL")
                    : emailSheet.processedAt
                      ? new Date(emailSheet.processedAt).toLocaleString("nl-NL")
                      : "-"}
                </div>
                <div>
                  <span className="text-gray-500">{t("email.subject")}</span>{" "}
                  <span className="font-medium">{emailSheet.subject || "-"}</span>
                </div>
              </div>

              {/* Attachments */}
              {emailSheet.attachments.length > 0 && (
                <div className="rounded-md border p-3">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" />
                    {t("email.attachments")} {emailSheet.attachments.length}{" "}
                    {emailSheet.attachments.length !== 1 ? t("email.files") : t("email.file")}
                  </h4>
                  <div className="space-y-1.5">
                    {emailSheet.attachments.map((att) => (
                      <a
                        key={att.index}
                        href={`/api/email-ingestions/${emailSheet.id}/attachment/${att.index}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <FileDown className="h-4 w-4 text-gray-500 shrink-0" />
                        <span className="truncate flex-1">{att.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {att.contentType === "application/pdf" ? "PDF" : att.contentType || ""}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {emailSheet.errors && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <h4 className="text-sm font-medium text-amber-800 mb-2">{t("emailLog.errorDetails")}</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
                    {emailSheet.errors.split(";").map((err, i) => (
                      <li key={i}>{err.trim()}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Email body */}
              {emailSheet.emailBodyHtml ? (
                <div
                  className="prose prose-sm max-w-none rounded-md border p-4"
                  dangerouslySetInnerHTML={{ __html: emailSheet.emailBodyHtml }}
                />
              ) : emailSheet.emailBody ? (
                <pre className="whitespace-pre-wrap rounded-md border bg-gray-50 p-4 text-sm">
                  {emailSheet.emailBody}
                </pre>
              ) : (
                <p className="text-sm text-gray-500">{t("email.noBody")}</p>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
