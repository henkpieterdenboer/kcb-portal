"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShipmentTable } from "@/components/shipments/shipment-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

function ArchiveListContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<{ shipments: []; pagination: { total: 0; page: 1; pageSize: 20; totalPages: 0 } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("archived", "true");
    fetch(`/api/shipments?${params.toString()}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading || !data) {
    return <Skeleton className="h-[600px]" />;
  }

  return <ShipmentTable shipments={data.shipments} pagination={data.pagination} mode="archived" />;
}

export default function ArchivePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Archived Shipments</h2>
        <Link href="/shipments">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Active Shipments
          </Button>
        </Link>
      </div>
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <ArchiveListContent />
      </Suspense>
    </div>
  );
}
