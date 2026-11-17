"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!auth) {
        setError("Firebase is not configured. Check your .env.local file.");
        setLoading(false);
        return;
      }
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      switch (code) {
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        case "auth/user-disabled":
          setError("This account has been disabled.");
          break;
        case "auth/user-not-found":
          setError("No account found with this email.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password.");
          break;
        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Try again later.");
          break;
        default:
          setError("Sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-lg font-medium text-zinc-100">Sign in</h1>
          <p className="text-xs text-zinc-500">
            Enter your credentials to access the command center.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-medium text-zinc-400"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@voltguard.io"
              className="block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-zinc-400"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 transition hover:bg-white active:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600">
          VoltGuard v4.0 — Authorized personnel only
        </p>
      </div>
    </div>
  );
}
