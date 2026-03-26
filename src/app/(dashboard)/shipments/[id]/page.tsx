"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
import { ArrowLeft, FileText, AlertTriangle, FlaskConical } from "lucide-react";

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
}

export default function ShipmentDetailPage() {
  const params = useParams();
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/shipments/${params.id}`)
        .then((res) => res.json())
        .then(setShipment)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

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
    return <div className="text-gray-500">Shipment not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/shipments"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shipments
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Transport</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><span className="text-gray-500">AWB:</span> <span className="font-mono">{shipment.awb || "-"}</span></div>
            <div><span className="text-gray-500">Origin:</span> {shipment.landVanOorsprong || "-"}</div>
            <div><span className="text-gray-500">Transport:</span> {shipment.transportNaarEU || "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Parties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><span className="text-gray-500">Declarant:</span> {shipment.aangever || "-"}</div>
            <div><span className="text-gray-500">Relation:</span> {shipment.relatienaam || "-"}</div>
            <div><span className="text-gray-500">Importer:</span> {shipment.importeur || "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Inspection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><span className="text-gray-500">Reference:</span> {shipment.referentie || "-"}</div>
            <div><span className="text-gray-500">Location:</span> {shipment.inspectielocatie ? shipment.inspectielocatie.substring(0, 40) : "-"}</div>
            <div><span className="text-gray-500">Date:</span> {shipment.inspectiedatum ? new Date(shipment.inspectiedatum).toLocaleDateString("nl-NL") : "-"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-shipments */}
      {shipment.subShipments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sub-shipments ({shipment.subShipments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead className="text-right">Colli</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Pieces</TableHead>
                  <TableHead>TARIC</TableHead>
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
                Inspection Reports
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
                        ? new Date(report.rapportdatum).toLocaleDateString("nl-NL")
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
                Blockade Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {shipment.blockadeReports.map((report) => (
                <div key={report.id} className="rounded-md border border-red-200 bg-red-50 p-3">
                  <div className="font-mono text-sm font-medium">{report.dossiernummer}</div>
                  <div className="mt-1 text-sm text-red-700">{report.reden || "Unknown reason"}</div>
                  {report.varieteit && (
                    <div className="mt-1 text-sm text-gray-500">Variety: {report.varieteit}</div>
                  )}
                  {report.monsternummer && (
                    <div className="text-sm text-gray-500">Sample: {report.monsternummer}</div>
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
                Sample Reports
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
                      Suspect: {report.vermoedenOorzaak}
                    </div>
                  )}
                  {report.diagnose && (
                    <div className="text-sm font-medium text-gray-700">
                      Diagnosis: {report.diagnose}
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
          <CardTitle className="text-base">Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline history={shipment.statusHistory} />
        </CardContent>
      </Card>
    </div>
  );
}
