import Link from "next/link";

export function PlaygroundShell({
  title,
  subtitle,
  stage,
  sidebar,
}: {
  title: string;
  subtitle: string;
  stage: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#050510] text-zinc-100">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <Link
            href="/"
            className="text-xs font-medium uppercase tracking-widest text-zinc-500 hover:text-zinc-300"
          >
            ← Pritzker Foundation Studio
          </Link>
          <h1 className="mt-1 text-lg font-semibold">{title}</h1>
        </div>
        <p className="hidden max-w-sm text-right text-sm text-zinc-400 sm:block">
          {subtitle}
        </p>
      </header>

      <div className="flex flex-col lg:flex-1 lg:flex-row">
        <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
          {stage}
        </main>
        <aside className="flex w-full flex-col gap-6 border-t border-white/10 p-6 lg:w-80 lg:border-t-0 lg:border-l">
          {sidebar}
        </aside>
      </div>
    </div>
  );
}
