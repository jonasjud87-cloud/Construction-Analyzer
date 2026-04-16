import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getToken(): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Nicht eingeloggt");
  return token;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.detail ?? json.error ?? "Fehler");
  if (json.error) throw new Error(json.error);
  return json.data as T;
}

async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail ?? json.error ?? "Fehler");
  if (json.error) throw new Error(json.error);
  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  postForm: <T>(path: string, formData: FormData) => requestForm<T>(path, formData),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
