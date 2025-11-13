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

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored !== null) {
                setIsCollapsed(stored === 'true')
            }
        }
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, isCollapsed.toString())
        }
    }, [isCollapsed])

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
