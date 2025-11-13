import Link from 'next/link'

interface LeftSidebarItemProps {
    icon: any
    label: string
    isActive?: boolean
    isCollapsed: boolean
    url?: string
}

const SidebarItem = (props: LeftSidebarItemProps) => {
    return (
        <Link
            href={props.url || '#'}
            className={`
                ${props.isCollapsed ? 'w-10 h-10 justify-center' : 'w-full justify-start px-4 py-2'}
                flex items-center space-x-2 rounded-md
                ${props.isActive ? 'bg-gray-100' : 'hover:bg-gray-100 transition-colors duration-200'}
            `}
        >
            {props.icon && (
                <span className='flex-shrink-0 w-4 h-4'>
                    <props.icon className='w-4 h-4' />
                </span>
            )}
            {!props.isCollapsed && <span className='ml-2 flex-1 truncate'>{props.label}</span>}
        </Link>
    )
}

export { SidebarItem }
