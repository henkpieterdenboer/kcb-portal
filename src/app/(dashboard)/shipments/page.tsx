"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { ShipmentTable } from "@/components/shipments/shipment-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";

function ShipmentListContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<{ shipments: []; pagination: { total: 0; page: 1; pageSize: 20; totalPages: 0 } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("archived")) params.set("archived", "false");
    fetch(`/api/shipments?${params.toString()}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading || !data) {
    return <Skeleton className="h-[600px]" />;
  }

  return <ShipmentTable shipments={data.shipments} pagination={data.pagination} mode="active" />;
}

export default function ShipmentsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("shipments.activeTitle")}</h2>
        <Link href="/shipments/archive">
          <Button variant="outline" size="sm" className="gap-2">
            <Archive className="h-4 w-4" />
            {t("shipments.viewArchive")}
          </Button>
        </Link>
      </div>
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <ShipmentListContent />
      </Suspense>
    </div>
  );
}
