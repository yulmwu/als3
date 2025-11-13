import { useState, useRef, useEffect } from 'react'

const useAccordion = (defaultOpen = true) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    const [height, setHeight] = useState<number | 'auto'>(defaultOpen ? 'auto' : 0)
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            setHeight(contentRef.current?.scrollHeight || 'auto')
        } else {
            setHeight(0)
        }
    }, [isOpen])

    return { isOpen, setIsOpen, height, contentRef }
}

export { useAccordion }
