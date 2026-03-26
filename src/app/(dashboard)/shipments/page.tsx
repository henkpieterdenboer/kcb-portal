"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShipmentTable } from "@/components/shipments/shipment-table";
import { Skeleton } from "@/components/ui/skeleton";

function ShipmentListContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<{ shipments: []; pagination: { total: 0; page: 1; pageSize: 20; totalPages: 0 } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/shipments?${searchParams.toString()}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading || !data) {
    return <Skeleton className="h-[600px]" />;
  }

  return <ShipmentTable shipments={data.shipments} pagination={data.pagination} />;
}

export default function ShipmentsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Shipments</h2>
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <ShipmentListContent />
      </Suspense>
    </div>
  );
}
