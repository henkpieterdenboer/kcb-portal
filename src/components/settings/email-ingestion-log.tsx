"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Mail, Search, ChevronDown, ChevronUp, FileDown, Paperclip } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface LinkedShipment {
  id: string;
  aangiftenummer: string;
  awb: string | null;
  status: string;
}

interface EmailIngestion {
  id: string;
  subject: string | null;
  fromAddress: string | null;
  receivedAt: string | null;
  processedAt: string;
  attachmentCount: number;
  status: string;
  errors: string | null;
  shipments: LinkedShipment[];
}

interface EmailDetail extends EmailIngestion {
  emailBody: string | null;
  emailBodyHtml: string | null;
  attachments: { name: string; contentType?: string; index: number }[];
}

interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const INGESTION_STATUSES = ["PROCESSED", "PARTIAL_ERROR", "PROCESSING"] as const;

export function EmailIngestionLog() {
  const { t } = useTranslation();
  const [ingestions, setIngestions] = useState<EmailIngestion[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchIngestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    params.set("page", String(page));

    const res = await fetch(`/api/email-ingestions?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setIngestions(data.ingestions);
      setPagination(data.pagination);
    }
    setLoading(false);
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchIngestions();
  }, [fetchIngestions]);

  function handleSearch() {
    setPage(1);
    fetchIngestions();
  }

  async function openEmailDetail(id: string) {
    setLoadingDetail(true);
    setSheetOpen(true);
    const res = await fetch(`/api/email-ingestions/${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedEmail(data);
    }
    setLoadingDetail(false);
  }

  function statusBadge(status: string) {
    const colors: Record<string, string> = {
      PROCESSED: "bg-green-100 text-green-700",
      PARTIAL_ERROR: "bg-amber-100 text-amber-700",
      PROCESSING: "bg-gray-100 text-gray-600",
    };
    const labels: Record<string, string> = {
      PROCESSED: t("emailLog.statusProcessed"),
      PARTIAL_ERROR: t("emailLog.statusPartialError"),
      PROCESSING: t("emailLog.statusProcessing"),
    };
    return (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}
      >
        {labels[status] || status}
      </span>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            {t("emailLog.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t("emailLog.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter || "ALL"}
              onValueChange={(v) => {
                setStatusFilter(v === "ALL" ? "" : (v ?? ""));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t("emailLog.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("emailLog.allStatuses")}</SelectItem>
                {INGESTION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`emailLog.status${s === "PROCESSED" ? "Processed" : s === "PARTIAL_ERROR" ? "PartialError" : "Processing"}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("emailLog.received")}</TableHead>
                  <TableHead>{t("emailLog.subject")}</TableHead>
                  <TableHead>{t("emailLog.from")}</TableHead>
                  <TableHead className="text-center">{t("emailLog.attachments")}</TableHead>
                  <TableHead>{t("emailLog.status")}</TableHead>
                  <TableHead>{t("emailLog.shipments")}</TableHead>
                  <TableHead>{t("emailLog.errors")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingestions.map((ing) => (
                  <>
                    <TableRow
                      key={ing.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => openEmailDetail(ing.id)}
                    >
                      <TableCell className="whitespace-nowrap text-sm text-gray-500">
                        {new Date(ing.processedAt).toLocaleString("nl-NL", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate" title={ing.subject || ""}>
                        {ing.subject || "-"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {ing.fromAddress || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          {ing.attachmentCount}
                        </span>
                      </TableCell>
                      <TableCell>{statusBadge(ing.status)}</TableCell>
                      <TableCell>
                        {ing.shipments.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {ing.shipments.map((s) => (
                              <Link
                                key={s.id}
                                href={`/shipments/${s.id}`}
                                className="text-xs text-blue-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {s.awb || s.aangiftenummer}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ing.errors ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(expandedId === ing.id ? null : ing.id);
                            }}
                            className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800"
                          >
                            {t("emailLog.errorDetails")}
                            {expandedId === ing.id ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedId === ing.id && ing.errors && (
                      <TableRow key={`${ing.id}-errors`}>
                        <TableCell colSpan={7} className="bg-amber-50 px-6 py-3">
                          <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                            {ing.errors.split(";").map((err, i) => (
                              <li key={i}>{err.trim()}</li>
                            ))}
                          </ul>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && ingestions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                      {t("emailLog.noEmails")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {t("emailLog.showing", {
                  start: (pagination.page - 1) * pagination.pageSize + 1,
                  end: Math.min(
                    pagination.page * pagination.pageSize,
                    pagination.total
                  ),
                  total: pagination.total,
                })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  {t("emailLog.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  {t("emailLog.next")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email detail sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedEmail(null);
        }}
      >
        <SheetContent side="right" className="sm:max-w-[50vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t("emailLog.viewEmail")}
            </SheetTitle>
            <SheetDescription>
              {selectedEmail?.subject || ""}
            </SheetDescription>
          </SheetHeader>

          {loadingDetail ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : selectedEmail ? (
            <div className="space-y-4 px-4 pb-4">
              {/* Email metadata */}
              <div className="rounded-md bg-gray-50 p-3 text-sm space-y-1">
                <div>
                  <span className="text-gray-500">{t("email.from")}</span>{" "}
                  <span className="font-medium">{selectedEmail.fromAddress || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t("email.date")}</span>{" "}
                  {selectedEmail.receivedAt
                    ? new Date(selectedEmail.receivedAt).toLocaleString("nl-NL")
                    : selectedEmail.processedAt
                      ? new Date(selectedEmail.processedAt).toLocaleString("nl-NL")
                      : "-"}
                </div>
                <div>
                  <span className="text-gray-500">{t("email.subject")}</span>{" "}
                  <span className="font-medium">{selectedEmail.subject || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{t("emailLog.status")}:</span>{" "}
                  {statusBadge(selectedEmail.status)}
                </div>
              </div>

              {/* Linked shipments */}
              {selectedEmail.shipments.length > 0 && (
                <div className="rounded-md border p-3">
                  <h4 className="text-sm font-medium mb-2">{t("emailLog.shipments")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.shipments.map((s) => (
                      <Link
                        key={s.id}
                        href={`/shipments/${s.id}`}
                        className="inline-flex items-center rounded-md border bg-white px-2.5 py-1 text-sm text-blue-600 hover:bg-blue-50 hover:underline"
                      >
                        {s.awb || s.aangiftenummer}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedEmail.attachments.length > 0 && (
                <div className="rounded-md border p-3">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" />
                    {t("email.attachments")} {selectedEmail.attachments.length}{" "}
                    {selectedEmail.attachments.length !== 1 ? t("email.files") : t("email.file")}
                  </h4>
                  <div className="space-y-1.5">
                    {selectedEmail.attachments.map((att) => (
                      <a
                        key={att.index}
                        href={`/api/email-ingestions/${selectedEmail.id}/attachment/${att.index}`}
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
              {selectedEmail.errors && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <h4 className="text-sm font-medium text-amber-800 mb-2">{t("emailLog.errorDetails")}</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
                    {selectedEmail.errors.split(";").map((err, i) => (
                      <li key={i}>{err.trim()}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Email body */}
              {selectedEmail.emailBodyHtml ? (
                <div
                  className="prose prose-sm max-w-none rounded-md border p-4"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.emailBodyHtml }}
                />
              ) : selectedEmail.emailBody ? (
                <pre className="whitespace-pre-wrap rounded-md border bg-gray-50 p-4 text-sm">
                  {selectedEmail.emailBody}
                </pre>
              ) : (
                <p className="text-sm text-gray-500">{t("email.noBody")}</p>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
