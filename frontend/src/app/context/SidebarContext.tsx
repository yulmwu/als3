'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextType {
    isCollapsed: boolean
    toggleCollapse: () => void
    setCollapse: (value: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

const STORAGE_KEY = 'sidebar_collapsed'

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isMobile = window.innerWidth <= 768
            const stored = localStorage.getItem(STORAGE_KEY)

            if (stored !== null) {
                setIsCollapsed(stored === 'true')
            } else if (isMobile) {
                setIsCollapsed(true)
            }

            setIsInitialized(true)
        }
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined' && isInitialized) {
            localStorage.setItem(STORAGE_KEY, isCollapsed.toString())
        }
    }, [isCollapsed, isInitialized])

    const toggleCollapse = () => setIsCollapsed((prev) => !prev)
    const setCollapse = (val: boolean) => setIsCollapsed(val)

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleCollapse, setCollapse }}>
            {children}
        </SidebarContext.Provider>
    )
}

export const useSidebar = () => {
    const context = useContext(SidebarContext)
    if (!context) throw new Error('useSidebar must be used within a SidebarProvider')
    return context
}
