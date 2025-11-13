import { X } from 'lucide-react'
import React from 'react'

interface AuthModalProps {
    visible: boolean
    onHide: () => void
    children: React.ReactNode
}

export default function AuthModal({ visible, onHide, children }: AuthModalProps) {
    if (!visible) return null

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onHide()
        }
    }

    return (
        <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-xs transition-colors duration-200'
            onClick={handleBackdropClick}
        >
            <div
                className='bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative'
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className='absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold'
                    onClick={onHide}
                    aria-label='Close'
                >
                    <X className='w-6 h-6' />
                </button>
                {children}
            </div>
        </div>
    )
}
