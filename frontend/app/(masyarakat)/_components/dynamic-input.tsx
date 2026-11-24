"use client";

import { FormFieldDef } from "@/types/citizen";
import { INPUT_CLS, TEXTAREA_CLS } from "./form";

interface Props {
  def: FormFieldDef;
  id: string;
  describedBy?: string;
  invalid: boolean;
  value: string;
  onChange: (v: string) => void;
}

/** Kolom isian dinamis menurut definisi form layanan (teks, area teks, tanggal, angka, pilihan). */
export function DynamicInput({ def, id, describedBy, invalid, value, onChange }: Props) {
  const common = { id, "aria-describedby": describedBy, "aria-invalid": invalid, value, required: !!def.required };
  if (def.type === "textarea")
    return <textarea {...common} className={TEXTAREA_CLS} maxLength={def.max_length ?? 2000} onChange={(e) => onChange(e.target.value)} />;
  if (def.type === "select")
    return (
      <select {...common} className={INPUT_CLS} onChange={(e) => onChange(e.target.value)}>
        <option value="">Pilih…</option>
        {(def.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  return (
    <input {...common} className={INPUT_CLS} maxLength={def.max_length ?? 255}
      type={def.type === "date" ? "date" : def.type === "number" ? "number" : "text"}
      onChange={(e) => onChange(e.target.value)} />
  );
}
