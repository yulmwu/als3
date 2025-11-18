const getUsagePct = (used: number, limit: number) =>
    Math.max(0, Math.min(100, Math.floor(((used || 0) / (limit || 1)) * 100)))

const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

export { getUsagePct, formatBytes }
