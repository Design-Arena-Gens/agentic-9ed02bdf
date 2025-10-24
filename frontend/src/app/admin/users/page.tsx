"use client";

import useSWR from "swr";
import dayjs from "dayjs";
import { useState } from "react";
import { AdminProtected } from "@/components/admin-protected";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetcher } from "@/lib/fetcher";
import { PublicUser } from "@/types";
import { toast } from "react-hot-toast";

type UsersResponse = { users: PublicUser[] };

export default function AdminUsersPage() {
  return (
    <AdminProtected>
      <UsersContent />
    </AdminProtected>
  );
}

const UsersContent = () => {
  const { data, mutate, isLoading } = useSWR<UsersResponse>("/api/admin/users", fetcher);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleUpdate = async (user: PublicUser, fields: Partial<{ balance: number; isBlocked: boolean }>) => {
    setUpdatingId(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Update failed" }));
        throw new Error(errorData.error ?? "Update failed");
      }
      toast.success("User updated");
      await mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update user");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Manage users</h1>
        <p className="text-sm text-slate-500">Adjust balances, block accounts, and monitor signups.</p>
      </div>

      {isLoading || !data ? (
        <Card>
          <p className="text-sm text-slate-500">Loading users...</p>
        </Card>
      ) : data.users.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">No users found.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.users.map((user) => (
            <Card key={user.id} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{user.email}</p>
                  <p className="text-xs text-slate-500">Joined {dayjs(user.createdAt).format("MMM D, YYYY")}</p>
                </div>
                <Badge variant={user.isBlocked ? "danger" : "success"}>
                  {user.isBlocked ? "Blocked" : "Active"}
                </Badge>
              </div>
              <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                <p>Balance: {user.balance.toFixed(6)} LTC</p>
                <p>Mining power: {user.miningPower.toFixed(2)} GH/s</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">Set balance</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      defaultValue={user.balance.toFixed(6)}
                      step="0.000001"
                      onBlur={(event) => {
                        const value = Number(event.target.value);
                        if (!Number.isFinite(value)) return;
                        if (value === user.balance) return;
                        handleUpdate(user, { balance: value });
                      }}
                      className="max-w-[160px]"
                    />
                    <span className="text-xs text-slate-500">LTC</span>
                  </div>
                </div>
                <Button
                  variant={user.isBlocked ? "secondary" : "danger"}
                  size="sm"
                  loading={updatingId === user.id}
                  onClick={() => handleUpdate(user, { isBlocked: !user.isBlocked })}
                >
                  {user.isBlocked ? "Unblock user" : "Block user"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
