"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Invalid password");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Failed to connect");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Gradient border wrapper */}
      <div className="rounded-xl bg-gradient-to-b from-primary/40 to-border/20 p-px">
        <div className="rounded-xl bg-card px-6 py-8 sm:px-8">
          {/* Brand */}
          <div className="mb-6 text-center">
            <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
              ClawLink
            </h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {"// authenticate"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2.5 font-mono text-base text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/50"
              />
            </div>

            {error && (
              <motion.p
                initial={{ x: -8 }}
                animate={{ x: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="text-sm text-destructive font-mono"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              className="w-full min-h-[48px] text-sm font-semibold"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
