import { RemindersPanel } from "@/components/reminders-panel";

export const metadata = {
  title: "Sundown | weekly reminders",
  description: "Set up a GitHub Action to open or update a weekly alarm issue.",
};

export default function RemindersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-16 pt-4 md:pb-24">
      <h1 className="text-3xl font-semibold text-ink">Weekly reminders</h1>
      <p className="mt-2 text-muted">
        GitHub Action setup for one repo at a time. The scan page does not turn
        this on for you.
      </p>
      <RemindersPanel showTitle={false} className="mt-8" />
    </main>
  );
}