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
import { useAuth } from "@/context/AuthContext";

export default function WithdrawPage() {
  return (
    <Protected>
      <WithdrawContent />
    </Protected>
  );
}

const WithdrawContent = () => {
  const { user, refresh } = useAuth();
  const { data } = useSWR<DashboardData>("/api/user/dashboard", fetcher);
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState(user?.ltcAddress ?? "");
  const [loading, setLoading] = useState(false);

  const minWithdraw = data?.limits.minWithdraw ?? 0.05;
  const fee = data?.limits.withdrawFee ?? 0.001;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), ltcAddress: address }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Withdrawal failed" }));
        throw new Error(errorData.error ?? "Withdrawal failed");
      }

      await refresh();
      toast.success("Withdrawal request submitted");
      setAmount("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Withdrawal submission failed");
    } finally {
      setLoading(false);
    }
  };

  const remainingBalance = user ? user.balance - Number(amount || 0) - fee : 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Withdraw Litecoin</h1>
        <p className="text-sm text-slate-500">
          Submit a withdrawal request. Admins review each request before sending funds.
        </p>
      </div>

      <Card>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Amount (LTC)
              </label>
              <Input
                id="amount"
                type="number"
                min={minWithdraw}
                step="0.000001"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
              <p className="text-xs text-slate-500">Minimum withdrawal {minWithdraw} LTC.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Destination LTC Address
              </label>
              <Input
                id="address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                required
              />
              <p className="text-xs text-slate-500">Ensure the address belongs to your Litecoin wallet.</p>
            </div>
          </div>
          <div className="rounded-lg bg-slate-100 p-4 text-sm dark:bg-slate-800">
            <p className="font-medium">Summary</p>
            <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-300">
              <li>Requested amount: {Number(amount || 0).toFixed(6)} LTC</li>
              <li>Network/processing fee: {fee.toFixed(6)} LTC</li>
              <li>
                Remaining balance after request: {remainingBalance.toFixed(6)} LTC (approx.)
              </li>
            </ul>
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Submit Withdrawal Request
          </Button>
        </form>
      </Card>
    </div>
  );
};
