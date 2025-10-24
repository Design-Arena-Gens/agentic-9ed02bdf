"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "./ui/spinner";
import { useAuth } from "@/context/AuthContext";

export const Protected = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    );
  }

  return <>{children}</>;
};
