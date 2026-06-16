const BASE_URL = 'http://localhost:8000/api/v1/sandbox';

export const sandboxApi = {
  listFiles: async (path: string = "") => {
    const res = await fetch(`${BASE_URL}/files?path=${encodeURIComponent(path)}`);
    if (!res.ok) throw new Error("Failed to list files");
    return res.json();
  },
  readFile: async (path: string) => {
    const res = await fetch(`${BASE_URL}/file?path=${encodeURIComponent(path)}`);
    if (!res.ok) throw new Error("Failed to read file");
    return res.json();
  },
  writeFile: async (path: string, content: string) => {
    const res = await fetch(`${BASE_URL}/file?path=${encodeURIComponent(path)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (!res.ok) throw new Error("Failed to write file");
    return res.json();
  }
};
