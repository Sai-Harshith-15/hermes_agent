import { fetchApi, API_BASE_URL } from './client';

export async function login(username: string, password: string) {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  return data;
}

export async function fetchMe() {
  return await fetchApi('/auth/me');
}

export async function setupAdmin(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Setup failed' }));
    throw new Error(err.detail || 'Setup failed');
  }
  return response.json();
}
