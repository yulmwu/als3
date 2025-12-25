import axios from 'axios'

// @ts-ignore
const BASE_URL = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__?.apiUrl 
    ? window.__RUNTIME_CONFIG__.apiUrl 
    : 'http://localhost:3000/api'

export { BASE_URL }

export const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})
