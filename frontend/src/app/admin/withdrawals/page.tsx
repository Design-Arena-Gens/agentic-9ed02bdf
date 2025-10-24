"use client";

import useSWR from "swr";
import dayjs from "dayjs";
import { useState } from "react";
import { AdminProtected } from "@/components/admin-protected";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetcher } from "@/lib/fetcher";
import { WithdrawalRecord } from "@/types";
import { toast } from "react-hot-toast";

type WithdrawalsResponse = { withdrawals: WithdrawalRecord[] };

export default function AdminWithdrawalsPage() {
  return (
    <AdminProtected>
      <WithdrawalsContent />
    </AdminProtected>
  );
}

const WithdrawalsContent = () => {
  const { data, mutate, isLoading } = useSWR<WithdrawalsResponse>("/api/admin/withdrawals", fetcher);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleProcess = async (id: number) => {
    const txid = window.prompt("Enter TXID for this withdrawal:");
    if (!txid) {
      return;
    }
    await handleAction(id, "process", { txid });
  };

  const handleAction = async (id: number, action: "process" | "reject", body?: Record<string, unknown>) => {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/admin/withdrawals/${id}/${action}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Action failed" }));
        throw new Error(errorData.error ?? "Action failed");
      }
      toast.success(`Withdrawal ${action === "process" ? "processed" : "rejected"}`);
      await mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update withdrawal");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Manage withdrawals</h1>
        <p className="text-sm text-slate-500">
          Review withdrawal requests and mark them as completed when funds are sent.
        </p>
      </div>

      <Card>
        {isLoading || !data ? (
          <p className="text-sm text-slate-500">Loading withdrawals...</p>
        ) : data.withdrawals.length === 0 ? (
          <p className="text-sm text-slate-500">No withdrawal requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-100 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">User</th>
                  <th className="px-4 py-2 text-left font-medium">Amount</th>
                  <th className="px-4 py-2 text-left font-medium">Address</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">Date</th>
                  <th className="px-4 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {data.withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id}>
                    <td className="px-4 py-2">{withdrawal.email ?? `User #${withdrawal.userId}`}</td>
                    <td className="px-4 py-2">{withdrawal.amount.toFixed(6)} LTC</td>
                    <td className="px-4 py-2 font-mono text-xs">{withdrawal.ltcAddress}</td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={
                          withdrawal.status === "completed"
                            ? "success"
                            : withdrawal.status === "pending"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {withdrawal.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">{dayjs(withdrawal.createdAt).format("MMM D, YYYY HH:mm")}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          loading={processingId === withdrawal.id && withdrawal.status === "pending"}
                          disabled={withdrawal.status !== "pending"}
                          onClick={() => handleProcess(withdrawal.id)}
                        >
                          Process
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={processingId === withdrawal.id && withdrawal.status === "pending"}
                          disabled={withdrawal.status !== "pending"}
                          onClick={() => handleAction(withdrawal.id, "reject")}
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
