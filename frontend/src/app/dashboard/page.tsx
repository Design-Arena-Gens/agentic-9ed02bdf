"use client";

import useSWR from "swr";
import { toast } from "react-hot-toast";
import { Protected } from "@/components/protected";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardData } from "@/types";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";
import dayjs from "dayjs";

export default function DashboardPage() {
  return (
    <Protected>
      <DashboardContent />
    </Protected>
  );
}

const DashboardContent = () => {
  const { data, isLoading } = useSWR<DashboardData>("/api/user/dashboard", fetcher, {
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading || !data) {
    return <div className="text-center text-sm text-slate-500">Loading dashboard...</div>;
  }

  const { user, depositAddress, estimatedDailyProfit, purchases, transactions, limits } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Welcome back, {user.email}. Your mining rig is running smoothly.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="space-y-3">
          <p className="text-sm text-slate-500">Available Balance</p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {user.balance.toFixed(6)} <span className="text-sm text-slate-500">LTC</span>
          </h2>
          <Button variant="secondary" asChild>
            <Link href="/withdraw">Request Withdrawal</Link>
          </Button>
        </Card>
        <Card className="space-y-3">
          <p className="text-sm text-slate-500">Mining Power</p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {user.miningPower.toFixed(2)} <span className="text-sm text-slate-500">GH/s</span>
          </h2>
          <Button variant="secondary" asChild>
            <Link href="/packages">Upgrade Power</Link>
          </Button>
        </Card>
        <Card className="space-y-3">
          <p className="text-sm text-slate-500">Estimated Daily Profit</p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {estimatedDailyProfit.toFixed(6)} <span className="text-sm text-slate-500">LTC</span>
          </h2>
          <p className="text-xs text-slate-500">
            Based on active packages
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Deposit Funds</h3>
              <p className="text-sm text-slate-500">
                Send Litecoin to the platform wallet and submit your TXID for approval.
              </p>
            </div>
            <Badge variant="default">Min {limits.minDeposit} LTC</Badge>
          </div>
          <div className="rounded-lg bg-slate-100 p-4 text-sm font-mono dark:bg-slate-800">
            {depositAddress}
          </div>
          <Button asChild>
            <Link href="/deposit">Submit Deposit</Link>
          </Button>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Withdraw Earnings</h3>
              <p className="text-sm text-slate-500">
                Request Litecoin payouts directly to your personal wallet.
              </p>
            </div>
            <Badge variant="warning">Fee {limits.withdrawFee} LTC</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Minimum withdrawal {limits.minWithdraw} LTC. Requests are processed by admins once verified.
          </p>
          <Button variant="secondary" asChild>
            <Link href="/withdraw">New Withdrawal</Link>
          </Button>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Active Packages</h3>
          <Button variant="ghost" asChild>
            <Link href="/packages">Browse Packages</Link>
          </Button>
        </div>
        {purchases.length === 0 ? (
          <p className="text-sm text-slate-500">No package purchases yet.</p>
        ) : (
          <div className="space-y-3">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex flex-wrap items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{purchase.package.name}</p>
                  <p className="text-sm text-slate-500">
                    {purchase.package.miningPower} GH/s • {purchase.package.dailyProfitPercent}% daily ROI
                  </p>
                </div>
                <span className="text-sm text-slate-500">
                  Since {dayjs(purchase.createdAt).format("MMM D, YYYY")}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Transactions</h3>
          <Button variant="ghost" asChild>
            <Link href="/transactions">View All</Link>
          </Button>
        </div>
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-500">No transactions logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-100 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">
                    Amount (LTC)
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-2 capitalize text-slate-700 dark:text-slate-200">
                      {transaction.type}
                    </td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {transaction.amount.toFixed(6)}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{transaction.description}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {dayjs(transaction.createdAt).format("MMM D, YYYY HH:mm")}
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
