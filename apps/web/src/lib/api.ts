const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
export async function api<T=any>(path:string, init:RequestInit={}) {
  const res = await fetch(`${API}${path}`, { ...init, credentials:"include", headers:{"content-type":"application/json",...(init.headers||{})} });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.message || data.error || "Request failed");
  return data as T;
}
