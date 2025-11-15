'use client'

import { Search, Plus, Menu, LogIn, Cloud } from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import UserMenu from './UserMenu'

interface HeaderProps {
    onMenuClick?: () => void
    searchQuery?: string
}

export function Header(props: HeaderProps) {
    const { user, logout, loading } = useAuth()
    const [search, setSearch] = useState(props.searchQuery ?? '')
    const pathname = usePathname()
    const [loginHref, setLoginHref] = useState('/login')

    useEffect(() => {
        if (pathname && pathname !== '/') {
            setLoginHref(`/login?redirect=${encodeURIComponent(pathname)}`)
        } else {
            setLoginHref('/login')
        }
    }, [pathname])

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && search.trim().length > 0) {
            window.location.href = `/search?query=${encodeURIComponent(search.trim())}`
        }
    }

    return (
        <>
            <header className='bg-white border-b border-gray-200 sticky top-0 z-50 w-full px-0 lg:px-4'>
                <div className='flex items-center justify-between px-2 md:px-4 py-2 gap-2'>
                    <div className='flex items-center gap-2 min-w-0'>
                        {props.onMenuClick && (
                            <button
                                className='p-2 rounded-full hover:bg-gray-100 md:hidden flex items-center justify-center'
                                aria-label='Open menu'
                                onClick={props.onMenuClick}
                            >
                                <Menu className='w-6 h-6 text-gray-700' />
                            </button>
                        )}

                        <div className='hidden md:flex items-center space-x-2'>
                            <a href='/' className='flex items-center space-x-2'>
                                <Cloud className='w-6 h-6 text-slate-600' />
                                <span className='text-lg md:text-xl font-bold text-slate-600 truncate'>ALS3</span>
                            </a>
                        </div>
                    </div>

                    <div className='flex-1 max-w-xs md:max-w-2xl mx-2 md:mx-8'>
                        <div className='relative'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4' />
                            <input
                                placeholder='검색...'
                                className='pl-10 bg-gray-100 border border-gray-200 rounded-full w-full py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200'
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                    </div>

                    <div className='flex items-center gap-2'>
                        <button className='w-9 h-9 flex-shrink-0 bg-slate-600 hover:bg-slate-700 text-white rounded-full flex items-center justify-center'>
                            <Plus className='w-4 h-4' />
                        </button>
                        {loading ? null : user ? (
                            <UserMenu user={user} onLogout={logout} />
                        ) : (
                            <>
                                <Link
                                    href={loginHref}
                                    className='w-9 md:w-auto h-9 flex-shrink-0 flex items-center justify-center gap-1 md:px-3 md:py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700'
                                    aria-label='로그인'
                                >
                                    <LogIn className='w-4 h-4' />
                                    <span className='hidden md:inline ml-1.5'>로그인/회원가입</span>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>
        </>
    )
}
