"use client";

import useSWR from "swr";
import dayjs from "dayjs";
import { Protected } from "@/components/protected";
import { Card } from "@/components/ui/card";
import { TransactionSummary } from "@/types";
import { fetcher } from "@/lib/fetcher";

type TransactionsResponse = {
  transactions: TransactionSummary[];
};

export default function TransactionsPage() {
  return (
    <Protected>
      <TransactionsContent />
    </Protected>
  );
}

const TransactionsContent = () => {
  const { data, isLoading } = useSWR<TransactionsResponse>("/api/user/transactions", fetcher);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Transaction log</h1>
        <p className="text-sm text-slate-500">Track all balance movements across your account.</p>
      </div>

      <Card>
        {isLoading || !data ? (
          <p className="text-sm text-slate-500">Loading transactions...</p>
        ) : data.transactions.length === 0 ? (
          <p className="text-sm text-slate-500">No transactions recorded yet.</p>
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
                {data.transactions.map((transaction) => (
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
