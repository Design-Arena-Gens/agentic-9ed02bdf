"use client";

import useSWR from "swr";
import Link from "next/link";
import { AdminProtected } from "@/components/admin-protected";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminSummary, DepositRecord, WithdrawalRecord } from "@/types";
import { fetcher } from "@/lib/fetcher";
import dayjs from "dayjs";

type SummaryResponse = AdminSummary;
type DepositsResponse = { deposits: DepositRecord[] };
type WithdrawalsResponse = { withdrawals: WithdrawalRecord[] };

export default function AdminOverviewPage() {
  return (
    <AdminProtected>
      <AdminOverview />
    </AdminProtected>
  );
}

const AdminOverview = () => {
  const { data: summary } = useSWR<SummaryResponse>("/api/admin/summary", fetcher);
  const { data: deposits } = useSWR<DepositsResponse>("/api/admin/deposits", fetcher);
  const { data: withdrawals } = useSWR<WithdrawalsResponse>("/api/admin/withdrawals", fetcher);

  const latestDeposits = deposits?.deposits.slice(0, 5) ?? [];
  const latestWithdrawals = withdrawals?.withdrawals.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Admin dashboard</h1>
        <p className="text-sm text-slate-500">Monitor platform activity and manage user operations.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="space-y-2">
          <p className="text-sm text-slate-500">Total users</p>
          <p className="text-3xl font-semibold text-slate-900 dark:text-white">
            {summary?.users ?? "-"}
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm text-slate-500">Confirmed deposits</p>
          <p className="text-3xl font-semibold text-slate-900 dark:text-white">
            {(summary?.totalDeposits ?? 0).toFixed(3)} LTC
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm text-slate-500">Completed withdrawals</p>
          <p className="text-3xl font-semibold text-slate-900 dark:text-white">
            {(summary?.totalWithdrawals ?? 0).toFixed(3)} LTC
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent deposits</h2>
            <Button variant="ghost" asChild>
              <Link href="/admin/deposits">Manage</Link>
            </Button>
          </div>
          {latestDeposits.length === 0 ? (
            <p className="text-sm text-slate-500">No deposits submitted yet.</p>
          ) : (
            <div className="space-y-3 text-sm">
              {latestDeposits.map((deposit) => (
                <div key={deposit.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {deposit.email ?? `User #${deposit.userId}`}
                  </p>
                  <p className="text-slate-500">
                    {deposit.amount} LTC • {deposit.status} • {dayjs(deposit.createdAt).format("MMM D, HH:mm")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent withdrawals</h2>
            <Button variant="ghost" asChild>
              <Link href="/admin/withdrawals">Manage</Link>
            </Button>
          </div>
          {latestWithdrawals.length === 0 ? (
            <p className="text-sm text-slate-500">No withdrawal requests yet.</p>
          ) : (
            <div className="space-y-3 text-sm">
              {latestWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {withdrawal.email ?? `User #${withdrawal.userId}`}
                  </p>
                  <p className="text-slate-500">
                    {withdrawal.amount} LTC • {withdrawal.status} • {dayjs(withdrawal.createdAt).format("MMM D, HH:mm")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
