const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data.data;
}

export const api = {
  register: (body: { email: string; password: string; username: string; gender?: string; country?: string }) =>
    request<{ user: any; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<{ user: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  guestLogin: () =>
    request<{ user: any; token: string }>('/auth/guest', { method: 'POST' }),

  getMe: () => request<{ user: any }>('/auth/me'),

  getTurnCredentials: () =>
    request<{ iceServers: any[] }>('/turn/credentials'),

  reportUser: (body: { reportedId: string; chatSessionId?: string; reason: string; description?: string }) =>
    request<{ report: any }>('/reports', { method: 'POST', body: JSON.stringify(body) }),

  getStats: () => request<{ onlineCount: number; queueSize: number }>('/stats'),
};
