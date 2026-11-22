import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-3xl items-center justify-between px-6 pt-6">
      <Link href="/" className="text-sm font-medium text-muted transition hover:text-ink">
        Sundown
      </Link>
      <nav className="flex gap-5 text-sm">
        <Link href="/" className="text-muted transition hover:text-ink">
          Scan
        </Link>
        <Link href="/reminders" className="text-muted transition hover:text-ink">
          Reminders
        </Link>
      </nav>
    </header>
  );
}