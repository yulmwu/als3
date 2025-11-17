'use client'

import { ReactNode, useState, useEffect } from 'react'
import { Header } from './Header'
import { LeftSidebar } from './LeftSidebar'
import { RightSidebar } from './RightSidebar'
import { useSidebar } from '../context/SidebarContext'

interface PageLayoutProps {
    children: ReactNode
    currentItem?: string
    searchQuery?: string
}

export const PageLayout = (props: PageLayoutProps) => {
    const [isMobile, setIsMobile] = useState(false)
    const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false)

    const { isCollapsed, toggleCollapse } = useSidebar()

    useEffect(() => {
        const handleResize = () => {
            const isNowMobile = window.innerWidth <= 768
            setIsMobile(isNowMobile)

            if (isNowMobile) {
                setIsMobileOverlayOpen(false)
            }
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const handleToggle = () => {
        if (isMobile) {
            setIsMobileOverlayOpen((prev) => !prev)
        } else {
            toggleCollapse()
        }
    }

    return (
        <div className='min-h-screen'>
            <Header onMenuClick={handleToggle} searchQuery={props.searchQuery} />
            <div className='flex'>
                {isMobile && isMobileOverlayOpen && (
                    <div className='fixed inset-0 z-40 bg-black/40' onClick={() => setIsMobileOverlayOpen(false)} />
                )}
                <LeftSidebar
                    isCollapsed={isMobile ? !isMobileOverlayOpen : isCollapsed}
                    onToggle={handleToggle}
                    isMobile={isMobile}
                    isSidebarOpen={isMobileOverlayOpen}
                    closeSidebar={() => setIsMobileOverlayOpen(false)}
                    currentItem={props.currentItem}
                />
                <main className='flex-1 min-h-[calc(100vh-4rem)] overflow-y-auto'>{props.children}</main>
                <RightSidebar />
            </div>
        </div>
    )
}
