export interface CitizenProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  nik_masked: string | null;
  district_id: string;
  district_name: string | null;
  village_id: string | null;
  village_name: string | null;
  email_verified: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface CitizenSessionData {
  citizen: CitizenProfile;
  csrf_token: string;
}

export interface FormFieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "number" | "select";
  required?: boolean;
  options?: string[];
  max_length?: number;
}

export interface RequiredDocument {
  code: string;
  label: string;
  required?: boolean;
  uploaded?: boolean;
}

export interface CitizenServiceItem {
  id: string;
  code: string;
  name: string;
  description: string;
  category: "perizinan" | "nonperizinan" | "rekomendasi" | "legalisasi";
  sla_days: number;
  requires_village_letter: boolean;
  form_fields: FormFieldDef[];
  required_documents: RequiredDocument[];
}

export interface CitizenDocument {
  id: string;
  doc_code: string;
  doc_label: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

export interface CitizenTimelineItem {
  status: string;
  public_note: string;
  changed_at: string;
}

export interface CitizenRequest {
  id: string;
  registration_number: string | null;
  letter_number?: string | null;
  has_signed_letter?: boolean;
  status: string;
  service_type_id: string;
  service_type_name: string;
  village_id: string | null;
  village_name: string | null;
  applicant_name: string;
  applicant_nik_masked: string | null;
  applicant_phone: string | null;
  applicant_address: string | null;
  village_cover_letter_no: string | null;
  data: Record<string, string>;
  requires_village_letter?: boolean;
  form_fields?: FormFieldDef[];
  required_documents: RequiredDocument[];
  documents: CitizenDocument[];
  timeline: CitizenTimelineItem[];
  sla_due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CitizenRequestPage {
  total: number;
  skip: number;
  limit: number;
  data: CitizenRequest[];
}
