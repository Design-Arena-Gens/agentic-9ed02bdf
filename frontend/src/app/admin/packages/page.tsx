"use client";

import useSWR from "swr";
import { FormEvent, useState } from "react";
import { AdminProtected } from "@/components/admin-protected";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetcher } from "@/lib/fetcher";
import { PackageSummary } from "@/types";
import { toast } from "react-hot-toast";

type PackagesResponse = { packages: PackageSummary[] };

export default function AdminPackagesPage() {
  return (
    <AdminProtected>
      <PackagesContent />
    </AdminProtected>
  );
}

const PackagesContent = () => {
  const { data, mutate, isLoading } = useSWR<PackagesResponse>("/api/admin/packages", fetcher);
  const [form, setForm] = useState({
    name: "",
    price: "",
    miningPower: "",
    dailyProfitPercent: "",
  });
  const [loadingId, setLoadingId] = useState<number | "create" | null>(null);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setLoadingId("create");
    try {
      const response = await fetch("/api/admin/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          price: Number(form.price),
          miningPower: Number(form.miningPower),
          dailyProfitPercent: Number(form.dailyProfitPercent),
          isActive: true,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Create failed" }));
        throw new Error(errorData.error ?? "Create failed");
      }
      toast.success("Package created");
      setForm({ name: "", price: "", miningPower: "", dailyProfitPercent: "" });
      await mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create package");
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdate = async (pkg: PackageSummary, updates: Partial<PackageSummary>) => {
    setLoadingId(pkg.id);
    try {
      const response = await fetch(`/api/admin/packages/${pkg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Update failed" }));
        throw new Error(errorData.error ?? "Update failed");
      }
      toast.success("Package updated");
      await mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update package");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (pkg: PackageSummary) => {
    if (!window.confirm(`Delete package ${pkg.name}?`)) return;
    setLoadingId(pkg.id);
    try {
      const response = await fetch(`/api/admin/packages/${pkg.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Delete failed" }));
        throw new Error(errorData.error ?? "Delete failed");
      }
      toast.success("Package deleted");
      await mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete package");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Manage packages</h1>
        <p className="text-sm text-slate-500">Create, edit, or remove mining packages.</p>
      </div>

      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
          <Input
            placeholder="Package name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <Input
            placeholder="Price (LTC)"
            type="number"
            step="0.000001"
            value={form.price}
            onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
            required
          />
          <Input
            placeholder="Mining power (GH/s)"
            type="number"
            step="0.01"
            value={form.miningPower}
            onChange={(event) => setForm((prev) => ({ ...prev, miningPower: event.target.value }))}
            required
          />
          <Input
            placeholder="Daily ROI %"
            type="number"
            step="0.01"
            value={form.dailyProfitPercent}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, dailyProfitPercent: event.target.value }))
            }
            required
          />
          <Button type="submit" loading={loadingId === "create"} className="md:col-span-2">
            Create package
          </Button>
        </form>
      </Card>

      {isLoading || !data ? (
        <Card>
          <p className="text-sm text-slate-500">Loading packages...</p>
        </Card>
      ) : data.packages.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">No packages created yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.packages.map((pkg) => (
            <Card key={pkg.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{pkg.name}</h2>
                <Badge variant={pkg.isActive ? "success" : "warning"}>
                  {pkg.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="grid gap-1 text-sm text-slate-600 dark:text-slate-300">
                <p>Price: {pkg.price} LTC</p>
                <p>Mining power: {pkg.miningPower} GH/s</p>
                <p>Daily ROI: {pkg.dailyProfitPercent}%</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={pkg.isActive ? "secondary" : "primary"}
                  size="sm"
                  loading={loadingId === pkg.id}
                  onClick={() => handleUpdate(pkg, { isActive: !pkg.isActive })}
                >
                  {pkg.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={loadingId === pkg.id}
                  onClick={() => handleDelete(pkg)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
