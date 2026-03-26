"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, ClipboardCheck, Ship, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface KpiCardsProps {
  todayArrivals: number;
  todayInspections: number;
  activeShipments: number;
  blocked: number;
}

export function KpiCards({ todayArrivals, todayInspections, activeShipments, blocked }: KpiCardsProps) {
  const { t } = useTranslation();
  const cards = [
    {
      title: t("dashboard.arrivalsToday"),
      value: todayArrivals,
      icon: Plane,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: t("dashboard.inspectionsToday"),
      value: todayInspections,
      icon: ClipboardCheck,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: t("dashboard.activeShipments"),
      value: activeShipments,
      icon: Ship,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      href: "/shipments",
    },
    {
      title: t("dashboard.blocked"),
      value: blocked,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const content = (
          <Card className={card.href ? "transition-colors hover:bg-gray-50 cursor-pointer" : ""}>
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
        );
        return card.href ? (
          <Link key={card.title} href={card.href}>{content}</Link>
        ) : (
          <div key={card.title}>{content}</div>
        );
      })}
    </div>
  );
}
