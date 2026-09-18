import { MostSelected } from "@/components/home/MostSelected";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-500/20 bg-black p-6">
        <p className="text-sm uppercase tracking-wide text-blue-400">D-Ligue 1 Fantasy</p>
        <h1 className="mt-2 text-3xl font-black text-white">Pick your 9. Chase the table.</h1>
        <p className="mt-2 max-w-2xl text-sm text-blue-200">
          Build a squad from Marseille, PSG, Lyon and Monaco. Save before the deadline. Points follow real school matches.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/squad" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-black">Pick squad</a>
          <a href="/live" className="rounded-full bg-blue-950 px-5 py-2 text-sm text-blue-100">Live score</a>
          <a href="/leaderboard" className="rounded-full bg-blue-950 px-5 py-2 text-sm text-blue-100">FPL table</a>
        </div>
      </section>
      <MostSelected />
    </div>
  );
}
