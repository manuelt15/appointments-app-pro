import { config } from './config.js';
async function request(path, options = {}) {
    const url = `${config.apiUrl}${path}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': config.apiKey,
            ...(options.headers ?? {}),
        },
    });
    const json = await res.json();
    if (!res.ok) {
        const message = typeof json.error === 'string' ? json.error : json.error?.message;
        throw new Error(message ?? `API error: ${res.status}`);
    }
    return json;
}
export async function apiCall(path, options = {}) {
    return (await request(path, options)).data;
}
export async function apiCallWithMeta(path, options = {}) {
    const response = await request(path, options);
    if (!response.meta)
        throw new Error('Paginated API response is missing metadata');
    return { data: response.data, meta: response.meta };
}
