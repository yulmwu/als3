import axios from 'axios'

// Runtime API URL configuration
// Client-side: uses runtime-config.js (injected by docker-entrypoint.sh)
// Server-side: uses API_URL environment variable (not bundled at build time)
// @ts-ignore
const BASE_URL = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__?.apiUrl 
    ? window.__RUNTIME_CONFIG__.apiUrl 
    : (process.env.API_URL || 'http://localhost:3000/api')

export { BASE_URL }

export const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})
