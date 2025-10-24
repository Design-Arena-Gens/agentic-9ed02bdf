"use client";

import useSWR from "swr";
import dayjs from "dayjs";
import { useState } from "react";
import { AdminProtected } from "@/components/admin-protected";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetcher } from "@/lib/fetcher";
import { DepositRecord } from "@/types";
import { toast } from "react-hot-toast";

type DepositsResponse = { deposits: DepositRecord[] };

export default function AdminDepositsPage() {
  return (
    <AdminProtected>
      <DepositsContent />
    </AdminProtected>
  );
}

const DepositsContent = () => {
  const { data, mutate, isLoading } = useSWR<DepositsResponse>("/api/admin/deposits", fetcher);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/admin/deposits/${id}/${action}`, { method: "POST" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Action failed" }));
        throw new Error(errorData.error ?? "Action failed");
      }
      toast.success(`Deposit ${action === "approve" ? "approved" : "rejected"}`);
      await mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update deposit");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Manage deposits</h1>
        <p className="text-sm text-slate-500">Approve or reject deposit submissions.</p>
      </div>

      <Card>
        {isLoading || !data ? (
          <p className="text-sm text-slate-500">Loading deposits...</p>
        ) : data.deposits.length === 0 ? (
          <p className="text-sm text-slate-500">No deposits found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-100 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">User</th>
                  <th className="px-4 py-2 text-left font-medium">Amount</th>
                  <th className="px-4 py-2 text-left font-medium">TXID</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">Date</th>
                  <th className="px-4 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {data.deposits.map((deposit) => (
                  <tr key={deposit.id}>
                    <td className="px-4 py-2">{deposit.email ?? `User #${deposit.userId}`}</td>
                    <td className="px-4 py-2">{deposit.amount.toFixed(6)} LTC</td>
                    <td className="px-4 py-2 font-mono text-xs">{deposit.txid}</td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={
                          deposit.status === "confirmed"
                            ? "success"
                            : deposit.status === "pending"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {deposit.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">{dayjs(deposit.createdAt).format("MMM D, YYYY HH:mm")}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          loading={processingId === deposit.id && deposit.status === "pending"}
                          disabled={deposit.status !== "pending"}
                          onClick={() => handleAction(deposit.id, "approve")}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={processingId === deposit.id && deposit.status === "pending"}
                          disabled={deposit.status !== "pending"}
                          onClick={() => handleAction(deposit.id, "reject")}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
