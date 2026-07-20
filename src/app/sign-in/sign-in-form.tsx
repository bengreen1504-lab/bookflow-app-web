"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction } from "@/lib/actions/auth";

export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        <div className="text-2xl font-black tracking-tight text-ink">BOOKFLOW</div>
        <h1 className="text-2xl font-extrabold text-ink text-center mt-7">Welcome Back</h1>
        <p className="text-sm text-gray text-center mt-1 mb-7">Sign in to continue</p>

        <form action={formAction} className="w-full flex flex-col gap-3.5">
          {next && <input type="hidden" name="next" value={next} />}
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full px-3.5 py-3 rounded-xl border border-border text-[15px] outline-none focus:border-teal"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full px-3.5 py-3 rounded-xl border border-border text-[15px] outline-none focus:border-teal"
          />

          {state?.error && <p className="text-sm text-error">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-4 rounded-xl bg-teal text-white font-bold text-[15.5px] mt-1 disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-teal font-bold">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
