"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { ReactNode } from "react";
import { Button, Checkbox, FormError } from "ui";
import { AppearanceInput } from "validators";
import { useAppearanceForm } from "@/app/(app)/settings/appearance/use-appearance-form";

type AppearanceFormProps = {
  initial: AppearanceInput;
};

type ThemeChoice = {
  value: AppearanceInput["theme"];
  label: string;
  description: string;
  icon: ReactNode;
};

const THEMES: ThemeChoice[] = [
  { value: "dark", label: "Dark", description: "The product as designed: near-black canvas, the artwork is the color.", icon: <Moon size={18} /> },
  { value: "light", label: "Light", description: "The same tokens, flipped: white surfaces, dark ink.", icon: <Sun size={18} /> },
  { value: "system", label: "Match my device", description: "Follows the device's setting, and changes when it does.", icon: <Monitor size={18} /> },
];

/** Theme as three cards with a radio behind each, and the motion switch. */
export const AppearanceForm = ({ initial }: AppearanceFormProps) => {
  const {
    form: { register, watch },
    state,
    isPending,
    onSubmit,
  } = useAppearanceForm(initial);
  const chosen = watch("theme");

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 rounded-card border border-hairline bg-surface p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg text-ink">Appearance</h2>
        <p className="text-sm text-muted">How Mediary looks on this device. Saved to your account and remembered here.</p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-ink">Theme</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {THEMES.map((theme) => {
            const active = chosen === theme.value;
            return (
              <label
                key={theme.value}
                className={`flex cursor-pointer flex-col gap-2 rounded-card border p-4 transition-colors ${
                  active ? "border-accent bg-accent-tint" : "border-hairline hover:border-hairline-strong"
                }`}
              >
                <input type="radio" value={theme.value} className="sr-only" {...register("theme")} />
                <span className={`flex items-center gap-2 text-sm font-medium ${active ? "text-ink" : "text-secondary"}`}>
                  <span className={active ? "text-accent" : "text-faint"}>{theme.icon}</span>
                  {theme.label}
                </span>
                <span className="text-xs text-muted">{theme.description}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 border-t border-hairline pt-5">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-ink">Motion</span>
          <span className="text-sm text-muted">Mediary already follows the reduced-motion setting on your device. This turns motion down here regardless.</span>
        </div>
        <Checkbox label="Reduce motion" {...register("reducedMotion")} />
      </div>

      <FormError message={state.error} />

      <div className="flex items-center justify-end gap-3 border-t border-hairline pt-5">
        {state.success && !isPending && <span className="text-sm text-success">Saved</span>}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving" : "Save changes"}
        </Button>
      </div>
    </form>
  );
};
