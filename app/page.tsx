import Link from "next/link";
import { OrganicBloomPreview } from "@/components/generators/OrganicBloomPreview";
import { KineticGridPreview } from "@/components/generators/KineticGridPreview";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#050510] text-zinc-100">
      <header className="border-b border-white/10 px-6 py-10 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Pritzker Foundation
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Generative Studio</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400 sm:text-base">
          A playground for experimenting with brand motion. Pick a system, tune it live,
          and export a still or a looping clip — no way to break it.
        </p>
      </header>

      <main className="mx-auto grid w-full max-w-4xl flex-1 grid-cols-1 gap-6 p-6 sm:grid-cols-2">
        <Link
          href="/studio/organic-bloom"
          className="group flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-white/25"
        >
          <div className="aspect-square w-full max-w-[260px]">
            <OrganicBloomPreview />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Organic Bloom</h2>
            <p className="mt-1 text-sm text-zinc-400">
              A wobbly, breathing gradient form with a soft grain finish.
            </p>
          </div>
        </Link>

        <Link
          href="/studio/kinetic-grid"
          className="group flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-white/25"
        >
          <div className="aspect-square w-full max-w-[260px]">
            <KineticGridPreview />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Kinetic Grid</h2>
            <p className="mt-1 text-sm text-zinc-400">
              The same palette, structured into a mosaic that ripples on touch.
            </p>
          </div>
        </Link>
      </main>
    </div>
  );
}
