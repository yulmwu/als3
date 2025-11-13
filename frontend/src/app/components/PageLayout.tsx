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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const { isCollapsed, toggleCollapse, setCollapse } = useSidebar()

    useEffect(() => {
        const handleResize = () => {
            const isNowMobile = window.innerWidth <= 768
            setIsMobile(isNowMobile)

            if (isNowMobile) {
                setIsSidebarOpen(false)
            }
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <div className='min-h-screen'>
            <Header onMenuClick={() => setIsSidebarOpen((prev) => !prev)} searchQuery={props.searchQuery} />
            <div className='flex'>
                {isMobile && isSidebarOpen && (
                    <div className='fixed inset-0 z-40 bg-black/40' onClick={() => setIsSidebarOpen(false)} />
                )}
                <LeftSidebar
                    isCollapsed={isMobile ? !isSidebarOpen : isCollapsed}
                    onToggle={() => {
                        if (isMobile) {
                            setIsSidebarOpen((prev) => !prev)
                        } else {
                            toggleCollapse()
                        }
                    }}
                    isMobile={isMobile}
                    isSidebarOpen={isSidebarOpen}
                    closeSidebar={() => setIsSidebarOpen(false)}
                    currentItem={props.currentItem}
                />
                <main className='flex-1 min-h-[calc(100vh-4rem)] overflow-y-auto'>{props.children}</main>
                <RightSidebar />
            </div>
        </div>
    )
}
