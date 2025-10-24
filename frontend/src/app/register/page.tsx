"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

const LTC_ADDRESS_REGEX = /^[LM3][a-km-zA-HJ-NP-Z1-9]{25,34}$/;

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ltcAddress, setLtcAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (ltcAddress && !LTC_ADDRESS_REGEX.test(ltcAddress)) {
      toast.error("Enter a valid Litecoin address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, ltcAddress: ltcAddress || undefined }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Registration failed" }));
        throw new Error(errorData.error ?? "Registration failed");
      }

      await refresh();
      toast.success("Account created");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <Card>
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Create account</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Start mining Litecoin with automated daily rewards.
            </p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2 text-left">
              <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2 text-left">
              <label
                htmlFor="ltcAddress"
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Litecoin address (optional)
              </label>
              <Input
                id="ltcAddress"
                value={ltcAddress}
                onChange={(event) => setLtcAddress(event.target.value)}
                placeholder="LKKEARwhFHcRhQbV84cgBJzftg8DRSk5QM"
              />
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              Create Account
            </Button>
          </form>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Already registered?{" "}
            <Link href="/login" className="text-brand-600 hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
