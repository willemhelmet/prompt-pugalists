const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || "Request failed");
  }

  return res.json();
}

// Auth
export const api = {
  createSession: () => request<{ sessionId: string }>("/auth/session", { method: "POST" }),

  // Characters
  getCharacters: (userId: string) =>
    request<any[]>(`/characters?userId=${userId}`),

  getCharacter: (id: string) => request<any>(`/characters/${id}`),

  createCharacter: (data: {
    userId: string;
    name: string;
    imageUrl: string;
    textPrompt: string;
    referenceImageUrl?: string;
  }) => request<any>("/characters", { method: "POST", body: JSON.stringify(data) }),

  updateCharacter: (
    id: string,
    data: { name: string; imageUrl: string; textPrompt: string; referenceImageUrl?: string },
  ) => request<any>(`/characters/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteCharacter: (id: string) =>
    request<{ deleted: boolean }>(`/characters/${id}`, { method: "DELETE" }),

  // Rooms
  getRoom: (id: string) => request<any>(`/rooms/${id}`),
};
