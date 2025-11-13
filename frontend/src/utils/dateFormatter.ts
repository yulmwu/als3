interface DateFormatterOptions {
    todayFormat?: boolean
    todayString?: string
    fullDateFormat?: boolean
}

const formatDate = (
    dateString: string,
    options: DateFormatterOptions = {
        todayFormat: true,
        todayString: '오늘',
    },
) => {
    const date = new Date(dateString)
    const today = new Date()
    const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()

    if (isToday && options.todayFormat) {
        return `${options.todayString ?? ''} ${date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        })}`
    }

    if (options.fullDateFormat) {
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        })
    }

    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
}

export { formatDate }
