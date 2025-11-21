import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    output: 'standalone',
    outputFileTracingRoot: __dirname,
    devIndicators: false,
}

export default nextConfig
