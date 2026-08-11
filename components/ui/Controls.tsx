"use client";

import { Palette, palettes } from "@/lib/palette";

export function ControlGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      {children}
    </div>
  );
}

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-[#6f95ff]"
    />
  );
}

export function PaletteSwatches({
  value,
  onChange,
}: {
  value: Palette;
  onChange: (palette: Palette) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {palettes.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-label={p.label}
          title={p.label}
          onClick={() => onChange(p)}
          className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
            value.id === p.id ? "border-white" : "border-transparent"
          }`}
          style={{
            background: `radial-gradient(circle at 35% 35%, ${p.stops[3]}, ${p.stops[1]})`,
          }}
        />
      ))}
    </div>
  );
}

export function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-[#6f95ff]" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

export function ActionButton({
  onClick,
  disabled,
  children,
  variant = "secondary",
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === "primary"
          ? "bg-[#6f95ff] text-black hover:bg-[#8fabff]"
          : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}
