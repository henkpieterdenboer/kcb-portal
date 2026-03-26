"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ship, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface KpiCardsProps {
  totals: Record<string, number>;
}

export function KpiCards({ totals }: KpiCardsProps) {
  const inProcess =
    (totals.AANGEMELD || 0) +
    (totals.INSPECTIE_AANGEVRAAGD || 0) +
    (totals.INSPECTIE_GEPLAND || 0) +
    (totals.DOCUMENTCONTROLE || 0) +
    (totals.DOCUMENTCONTROLE_AFGEROND || 0) +
    (totals.FYSIEKE_INSPECTIE || 0);

  const cards = [
    {
      title: "Total Shipments",
      value: totals.total || 0,
      icon: Ship,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "In Process",
      value: inProcess,
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      title: "Approved",
      value: totals.GOEDGEKEURD || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Blocked / Awaiting",
      value: (totals.GEBLOKKEERD || 0) + (totals.WACHT_OP_VERVOLG || 0),
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <div className={`rounded-md p-2 ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
