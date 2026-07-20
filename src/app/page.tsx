import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      <nav className="border-b border-border bg-white">
        <div className="max-w-[1180px] mx-auto px-7 h-[72px] flex items-center justify-between">
          <div className="font-black tracking-tight text-ink">BOOKFLOW</div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-bold text-ink">
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-bold text-white bg-teal rounded-[10px] px-4 py-2.5"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      <header className="max-w-[1180px] mx-auto px-7 py-20 text-center">
        <div className="text-xs font-extrabold tracking-widest text-teal-dark uppercase">
          For barbers, salons, cleaners &amp; detailers
        </div>
        <h1 className="text-5xl font-black text-ink mt-4 leading-tight">
          Booked solid.
          <br />
          <span className="text-teal-dark">Paid</span> without the chase.
        </h1>
        <p className="text-lg text-gray max-w-[46ch] mx-auto mt-5">
          BookFlow puts scheduling, payments, staff, and client history in one dashboard.
        </p>
        <div className="flex items-center justify-center gap-3.5 mt-8">
          <Link
            href="/sign-up"
            className="px-6 py-3.5 rounded-[11px] bg-teal text-white font-extrabold"
          >
            Start free trial
          </Link>
          <Link
            href="/sign-in"
            className="px-6 py-3.5 rounded-[11px] border border-border text-ink font-extrabold"
          >
            Sign in
          </Link>
        </div>
      </header>
    </div>
  );
}
