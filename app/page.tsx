export default function HomePage() {
  return (
    <section className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-700 via-blue-900 to-black p-10 text-white shadow-2xl">
      <p className="text-sm uppercase tracking-widest text-blue-200">Dority Fantasy League</p>
      <h1 className="mt-3 text-4xl font-semibold">Marseille, PSG, Lyon, Monaco</h1>
      <p className="mt-4 max-w-xl text-blue-100">
        Build a squad of 1 goalkeeper and 8 outfield players. Beat your friends. Follow the club table every gameweek.
      </p>
      <div className="mt-8 flex gap-3">
        <a href="/register" className="rounded-full bg-blue-500 px-5 py-2 font-medium text-black hover:bg-blue-400">Create your team</a>
        <a href="/login" className="rounded-full border border-blue-300/40 px-5 py-2 text-blue-100">Login</a>
      </div>
    </section>
  );
}
