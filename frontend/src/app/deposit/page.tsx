"use client";

import { FormEvent, useState } from "react";
import useSWR from "swr";
import { toast } from "react-hot-toast";
import { Protected } from "@/components/protected";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DashboardData } from "@/types";
import { fetcher } from "@/lib/fetcher";

export default function DepositPage() {
  return (
    <Protected>
      <DepositContent />
    </Protected>
  );
}

const DepositContent = () => {
  const { data } = useSWR<DashboardData>("/api/user/dashboard", fetcher);
  const [amount, setAmount] = useState("");
  const [txid, setTxid] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), txid }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Deposit failed" }));
        throw new Error(errorData.error ?? "Deposit failed");
      }

      toast.success("Deposit submitted. Awaiting admin approval.");
      setAmount("");
      setTxid("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Deposit submission failed");
    } finally {
      setLoading(false);
    }
  };

  const minDeposit = data?.limits.minDeposit ?? 0.01;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Deposit Litecoin</h1>
        <p className="text-sm text-slate-500">
          Send LTC to the platform wallet and submit the transaction hash to credit your balance.
        </p>
      </div>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Platform Wallet</h2>
          <p className="text-sm text-slate-500">Send only Litecoin (LTC) to this address.</p>
        </div>
        <div className="rounded-lg bg-slate-100 p-4 font-mono text-sm dark:bg-slate-800">
          {data?.depositAddress ?? "LKKEARwhFHcRhQbV84cgBJzftg8DRSk5QM"}
        </div>
        <p className="text-xs text-slate-500">
          Minimum deposit {minDeposit} LTC. Funds are credited once an admin confirms the TXID.
        </p>
      </Card>

      <Card>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Amount (LTC)
            </label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              min={minDeposit}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="txid" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Transaction ID (TXID)
            </label>
            <Input
              id="txid"
              value={txid}
              onChange={(event) => setTxid(event.target.value)}
              placeholder="Enter the TX hash"
              required
            />
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Submit Deposit
          </Button>
        </form>
      </Card>
    </div>
  );
};
