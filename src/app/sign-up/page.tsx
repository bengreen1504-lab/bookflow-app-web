"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUpAction } from "@/lib/actions/auth";

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUpAction, null);
  const [role, setRole] = useState<"customer" | "business_owner">("customer");

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[400px]">
        <h1 className="text-2xl font-extrabold text-ink text-center">Create your account</h1>
        <p className="text-sm text-gray text-center mt-1">
          {role === "customer" ? "Book your first service today" : "Set up your business on BookFlow"}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-white border border-border p-1">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`rounded-lg py-2 text-sm font-bold transition ${
              role === "customer" ? "bg-teal text-white" : "text-gray"
            }`}
          >
            I&apos;m a customer
          </button>
          <button
            type="button"
            onClick={() => setRole("business_owner")}
            className={`rounded-lg py-2 text-sm font-bold transition ${
              role === "business_owner" ? "bg-teal text-white" : "text-gray"
            }`}
          >
            I own a business
          </button>
        </div>

        <form action={formAction} className="mt-6 flex flex-col gap-3.5">
          <input type="hidden" name="role" value={role} />
          <input
            name="full_name"
            type="text"
            placeholder={role === "customer" ? "Full name" : "Your name"}
            required
            className="w-full px-3.5 py-3 rounded-xl border border-border text-[15px] outline-none focus:border-teal"
          />
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
            minLength={6}
            className="w-full px-3.5 py-3 rounded-xl border border-border text-[15px] outline-none focus:border-teal"
          />

          {state?.error && <p className="text-sm text-error">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-4 rounded-xl bg-teal text-white font-bold text-[15.5px] mt-1 disabled:opacity-60"
          >
            {pending ? "Creating account…" : role === "customer" ? "Create Account" : "Create Business Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray mt-4">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-teal font-bold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
