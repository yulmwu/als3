import { ChevronDown } from 'lucide-react'
import { ReactNode } from 'react'
import { useAccordion } from '../../hooks/useAccordion'

interface SidebarSectionProps {
    title: string
    children: ReactNode
    defaultOpen?: boolean
}

export const SidebarSection = ({ title, children, defaultOpen = true }: SidebarSectionProps) => {
    const { isOpen, setIsOpen, height, contentRef } = useAccordion(defaultOpen)

    return (
        <div className='mt-6'>
            <hr className='border-gray-200 mb-6' />
            <button onClick={() => setIsOpen(!isOpen)} className='flex items-center justify-between w-full mb-2 px-2'>
                <h3 className='text-sm font-medium text-gray-500 uppercase tracking-wide'>{title}</h3>
                <ChevronDown
                    className={`w-5 h-5 text-gray-900 transition-transform duration-200 ${
                        isOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                />
            </button>

            <div
                ref={contentRef}
                style={{
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease',
                    maxHeight: height === 'auto' ? 'none' : `${height}px`,
                }}
                className='space-y-1'
            >
                {children}
            </div>
        </div>
    )
}
