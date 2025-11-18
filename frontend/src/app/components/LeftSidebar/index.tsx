'use client'

import { Home, FolderOpen, User, ChevronsRight, ChevronsDown } from 'lucide-react'
import { SidebarItem } from './LeftSidebarItems'
import { useAuth } from '../../context/AuthContext'
import { formatBytes, getUsagePct } from '@/utils/byteFormatter'

interface LeftSidebarProps {
    isCollapsed: boolean
    onToggle: () => void
    isMobile?: boolean
    isSidebarOpen?: boolean
    closeSidebar?: () => void
    currentItem?: string
}

const LeftSidebar = (props: LeftSidebarProps) => {
    const { user } = useAuth()
    return (
        <div className='relative'>
            <nav
                className={
                    props.isMobile
                        ? `fixed top-0 left-0 z-[60] h-full w-64 bg-white border-r border-gray-200 shadow-lg transition-transform duration-300 ease-in-out ${props.isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
                        : `sticky top-14 z-30 bg-white border-r border-gray-200 transition-all duration-300 w-[${props.isCollapsed ? '56px' : '256px'}] h-[calc(100vh-4rem)]`
                }
                style={
                    props.isMobile
                        ? { height: '100vh', width: '16rem' }
                        : { width: props.isCollapsed ? '56px' : '256px', height: 'calc(100vh - 4rem)' }
                }
                aria-label='Sidebar'
            >
                {props.isMobile && (
                    <div className='flex justify-end p-2'>
                        <button
                            className='p-2 rounded-full hover:bg-gray-100 text-gray-700'
                            aria-label='Close menu'
                            onClick={props.closeSidebar}
                        >
                            <svg
                                width='24'
                                height='24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                                viewBox='0 0 24 24'
                            >
                                <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </button>
                    </div>
                )}
                <div className={`flex flex-col h-full ${props.isCollapsed ? 'p-2' : 'p-4'}`}>
                    <div className='flex-1 overflow-y-auto space-y-4'>
                        <div className='space-y-1'>
                            <SidebarItem
                                icon={Home}
                                label='홈'
                                url='/'
                                isActive={props.currentItem === 'home'}
                                isCollapsed={props.isCollapsed}
                            />
                            {user && (
                                <>
                                    <SidebarItem
                                        icon={FolderOpen}
                                        label='내 파일'
                                        url='/files'
                                        isActive={props.currentItem === 'files'}
                                        isCollapsed={props.isCollapsed}
                                    />
                                    <SidebarItem
                                        icon={User}
                                        label='내 정보'
                                        url='/profile'
                                        isActive={props.currentItem === 'profile'}
                                        isCollapsed={props.isCollapsed}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                    {user && (
                        <div className={`${props.isCollapsed ? 'px-1 py-2' : 'px-2 py-2'} border-t border-gray-200`}>
                            <div className={`${props.isCollapsed ? 'hidden' : 'block'} text-[11px] text-gray-600 mb-1`}>스토리지</div>
                            <div className='w-full h-2 bg-gray-200 rounded-full overflow-hidden'>
                                <div
                                    className={`${getUsagePct(user.storageUsed, user.storageLimit) > 90 ? 'bg-red-500' : getUsagePct(user.storageUsed, user.storageLimit) > 75 ? 'bg-yellow-500' : 'bg-blue-500'} h-full`}
                                    style={{ width: `${getUsagePct(user.storageUsed, user.storageLimit)}%` }}
                                />
                            </div>
                            {!props.isCollapsed && (
                                <div className='mt-1 text-[11px] text-gray-600'>{`${formatBytes(user.storageUsed)} / ${formatBytes(user.storageLimit)}`}</div>
                            )}
                        </div>
                    )}
                </div>
                {!props.isMobile && (
                    <button
                        onClick={props.onToggle}
                        className='absolute top-1/2 right-[-12px] z-40 -translate-y-14 bg-white border border-gray-300 p-1 rounded-4xl shadow hover:bg-gray-100'
                        aria-label={props.isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    >
                        {props.isCollapsed ? (
                            <ChevronsRight className='w-4 h-6 text-gray-600' />
                        ) : (
                            <ChevronsDown className='w-4 h-6 rotate-90 text-gray-600' />
                        )}
                    </button>
                )}
            </nav>
        </div>
    )
}

export { LeftSidebar }
