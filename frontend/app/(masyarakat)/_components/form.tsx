"use client";

import { useId } from "react";

export const INPUT_CLS = "clay-input w-full px-4 py-2.5 text-sm text-slate-900";
export const TEXTAREA_CLS =
  "clay-input w-full !rounded-2xl px-4 py-3 text-sm text-slate-900 min-h-28 resize-y";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => React.ReactNode;
}

/** Label + kolom isian + pesan galat yang terhubung ke pembaca layar. */
export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-600" aria-hidden> *</span>}
      </label>
      {children({ id, describedBy, invalid: !!error })}
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function fieldErrorMap(errors: Array<{ field: string; message: string }>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of errors) if (e.field && !out[e.field]) out[e.field] = e.message;
  return out;
}
