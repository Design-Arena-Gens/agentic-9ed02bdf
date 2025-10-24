"use client";

import useSWR from "swr";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { Protected } from "@/components/protected";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetcher } from "@/lib/fetcher";
import { PackageSummary } from "@/types";
import { useAuth } from "@/context/AuthContext";

type PackagesResponse = {
  packages: PackageSummary[];
};

export default function PackagesPage() {
  return (
    <Protected>
      <PackagesContent />
    </Protected>
  );
}

const PackagesContent = () => {
  const { refresh } = useAuth();
  const { data, isLoading, mutate } = useSWR<PackagesResponse>("/api/packages", fetcher);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handlePurchase = async (packageId: number) => {
    setLoadingId(packageId);
    try {
      const response = await fetch("/api/buy-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Purchase failed" }));
        throw new Error(errorData.error ?? "Purchase failed");
      }

      await Promise.all([refresh(), mutate()]);
      toast.success("Package purchased successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Package purchase failed");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Mining Packages</h1>
        <p className="text-sm text-slate-500">
          Choose a mining plan to increase your hashing power and earn higher daily rewards.
        </p>
      </div>

      {isLoading || !data ? (
        <p className="text-sm text-slate-500">Loading packages...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {data.packages.map((pkg) => (
            <Card key={pkg.id} className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{pkg.name}</h2>
                <Badge variant="success">{pkg.dailyProfitPercent}% Daily</Badge>
              </div>
              <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                <p>
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">
                    {pkg.price} LTC
                  </span>{" "}
                  purchase price
                </p>
                <p>Mining power: {pkg.miningPower} GH/s</p>
                <p>Daily ROI: {pkg.dailyProfitPercent}%</p>
              </div>
              <Button
                onClick={() => handlePurchase(pkg.id)}
                loading={loadingId === pkg.id}
                disabled={!pkg.isActive}
              >
                {pkg.isActive ? "Buy Package" : "Unavailable"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
