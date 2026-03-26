"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, ClipboardCheck, Ship, AlertTriangle } from "lucide-react";

interface KpiCardsProps {
  todayArrivals: number;
  todayInspections: number;
  activeShipments: number;
  blocked: number;
}

export function KpiCards({ todayArrivals, todayInspections, activeShipments, blocked }: KpiCardsProps) {
  const cards = [
    {
      title: "Arrivals Today",
      value: todayArrivals,
      icon: Plane,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Inspections Today",
      value: todayInspections,
      icon: ClipboardCheck,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: "Active Shipments",
      value: activeShipments,
      icon: Ship,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      title: "Blocked",
      value: blocked,
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
