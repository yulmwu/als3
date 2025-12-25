declare module '*.css'

declare global {
    interface Window {
        __RUNTIME_CONFIG__?: {
            apiUrl: string;
        };
    }
}

export {}

