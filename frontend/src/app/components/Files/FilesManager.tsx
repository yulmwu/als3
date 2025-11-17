'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    listFiles,
    createDirectory,
    uploadFile,
    deleteFile,
    renameFile,
    getDownloadUrlByUuid,
    FileItem,
} from '@/api/files'
import {
    Folder,
    File,
    Upload,
    FolderPlus,
    Trash2,
    Download,
    ChevronRight,
    Home,
    AlertCircle,
    Loader2,
    MoreHorizontal,
    X as XIcon,
    AlertTriangle,
    Plus,
    Edit,
} from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'

interface FilesManagerProps {
    currentUuid?: string
    onFileSelect?: (file: FileItem | null) => void
    onDownload?: (file: FileItem) => void
}

export const FilesManager = ({ currentUuid, onFileSelect, onDownload }: FilesManagerProps = {}) => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { user, initializing } = useAuth()
    const [page, setPage] = useState(1)
    const [openMenuUuid, setOpenMenuUuid] = useState<string | null>(null)
    const [menuPosition, setMenuPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 })
    const [confirmDeleteUuid, setConfirmDeleteUuid] = useState<string | null>(null)
    const [selectedFileForDetail, setSelectedFileForDetail] = useState<FileItem | null>(null)
    const [newFolderName, setNewFolderName] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [breadcrumb, setBreadcrumb] = useState<FileItem[]>([])
    const [openCreateMenu, setOpenCreateMenu] = useState(false)
    const [createMenuPos, setCreateMenuPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 })
    const [showInlineCreate, setShowInlineCreate] = useState(false)
    const [renamingUuid, setRenamingUuid] = useState<string | null>(null)
    const [renameValue, setRenameValue] = useState('')
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const queryClient = useQueryClient()

    useEffect(() => {
        if (initializing) return
        if (!user) {
            const qs = searchParams.toString()
            const current = qs ? `${pathname}?${qs}` : pathname
            router.push(`/login?redirect=${encodeURIComponent(current)}`)
        }
    }, [user, initializing, pathname, searchParams, router])

    useEffect(() => {
        const handleDocClick = (e: MouseEvent) => {
            if (!openMenuUuid) return
            const target = e.target as HTMLElement
            const container = document.querySelector(`[data-menu-uuid="${openMenuUuid}"]`) as HTMLElement | null
            const popup = document.querySelector(`[data-menu-popup="${openMenuUuid}"]`) as HTMLElement | null
            if ((container && target && container.contains(target)) || (popup && target && popup.contains(target)))
                return
            setOpenMenuUuid(null)
            setConfirmDeleteUuid(null)
        }
        document.addEventListener('click', handleDocClick)
        return () => document.removeEventListener('click', handleDocClick)
    }, [openMenuUuid])

    useEffect(() => {
        if (!renamingUuid) return

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const renameInput = document.querySelector(`[data-rename-input="${renamingUuid}"]`)
            if (renameInput && !renameInput.contains(target)) {
                handleCancelRename()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [renamingUuid])

    useEffect(() => {
        if (!currentUuid) {
            setBreadcrumb([])
            return
        }

        const buildBreadcrumb = async (uuid: string) => {
            try {
                const trail = await queryClient.fetchQuery({
                    queryKey: ['breadcrumb', uuid],
                    queryFn: async () => {
                        const response = await listFiles(uuid, 1, 1)
                        return response.breadcrumb
                    },
                })
                setBreadcrumb(trail)
            } catch (error) {
                console.error('Failed to build breadcrumb:', error)
                setBreadcrumb([])
            }
        }

        buildBreadcrumb(currentUuid)
    }, [currentUuid])

    const { data: filesData, isLoading } = useQuery({
        queryKey: ['files', currentUuid, page],
        queryFn: () => listFiles(currentUuid, page, 20),
        enabled: !!user,
    })

    useEffect(() => {
        const f = searchParams.get('f')
        if (!f) {
            setSelectedFileForDetail(null)
            return
        }
        if (filesData?.items) {
            const match = filesData.items.find((it) => it.uuid === f) || null
            setSelectedFileForDetail(match)
        }
    }, [searchParams, filesData])

    const createFolderMutation = useMutation({
        mutationFn: (name: string) => createDirectory({ name, parentUuid: currentUuid }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files', currentUuid] })
            setNewFolderName('')
            setOpenCreateMenu(false)
            setShowInlineCreate(false)
            setError(null)
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || '폴더 생성에 실패했습니다.')
        },
    })

    const uploadFileMutation = useMutation({
        mutationFn: (file: File) => uploadFile(file, currentUuid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files', currentUuid] })
            setOpenCreateMenu(false)
            setShowInlineCreate(false)
            setError(null)
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || '파일 업로드에 실패했습니다.')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteFile(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files', currentUuid] })
            setOpenMenuUuid(null)
            setError(null)
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || '삭제에 실패했습니다.')
        },
    })

    const renameMutation = useMutation({
        mutationFn: ({ id, newName }: { id: number; newName: string }) => renameFile(id, newName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files', currentUuid] })
            setRenamingUuid(null)
            setRenameValue('')
            setOpenMenuUuid(null)
            setError(null)
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || '이름 변경에 실패했습니다.')
        },
    })

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            setError(null)
            createFolderMutation.mutate(newFolderName.trim())
        }
    }

    const handleChooseFile = () => {
        fileInputRef.current?.click()
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setError(null)
            uploadFileMutation.mutate(file)
            e.currentTarget.value = ''
        }
    }

    const handleDelete = (item: FileItem) => {
        setError(null)
        setOpenMenuUuid(null)
        deleteMutation.mutate(item.id)
    }

    const handleStartRename = (item: FileItem) => {
        setRenamingUuid(item.uuid)
        setRenameValue(item.name)
        setOpenMenuUuid(null)
    }

    const handleRename = (item: FileItem) => {
        if (renameValue.trim() && renameValue.trim() !== item.name) {
            setError(null)
            renameMutation.mutate({ id: item.id, newName: renameValue.trim() })
        } else {
            setRenamingUuid(null)
            setRenameValue('')
        }
    }

    const handleCancelRename = () => {
        setRenamingUuid(null)
        setRenameValue('')
    }

    const handleDownload = async (item: FileItem) => {
        try {
            const data = await getDownloadUrlByUuid(item.uuid)
            if (data.downloadUrl) {
                window.open(data.downloadUrl, '_blank')
            }
            if (onDownload) onDownload(item)
        } catch (error) {
            console.error('Download failed:', error)
        }
    }

    const handleItemClick = (item: FileItem) => {
        if (item.type === 'directory') {
            setSelectedFileForDetail(null)
            if (onFileSelect) onFileSelect(null)
            router.push(`/files/${item.uuid}`)
        } else {
            setSelectedFileForDetail(item)
            if (onFileSelect) onFileSelect(item)
        }
    }

    const navigateToRoot = () => {
        setSelectedFileForDetail(null)
        if (onFileSelect) onFileSelect(null)
        router.push('/files')
    }

    const navigateToDirectory = (dir: FileItem) => {
        setSelectedFileForDetail(null)
        if (onFileSelect) onFileSelect(null)
        router.push(`/files/${dir.uuid}`)
    }

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '-'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (initializing) {
        return (
            <div className='max-w-7xl mx-auto p-6'>
                <div className='bg-white rounded-lg shadow p-12 text-center'>
                    <Loader2 className='w-12 h-12 mx-auto text-blue-600 animate-spin mb-4' />
                    <div className='text-gray-500'>로딩 중...</div>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className='max-w-7xl mx-auto'>
            <div className='bg-white'>
                <div className='p-4 sm:p-6'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4'>
                        <h1 className='text-xl sm:text-2xl font-bold text-gray-900'>내 파일</h1>
                        <div className='flex gap-2' data-create-menu-anchor='true'>
                            <button
                                onClick={(e) => {
                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                    const width = Math.min(288, window.innerWidth - 16)
                                    const left = Math.min(
                                        window.innerWidth - width - 8,
                                        Math.max(8, rect.right - width),
                                    )
                                    const top = rect.bottom + 8
                                    setCreateMenuPos({ left, top })
                                    setOpenCreateMenu((p) => !p)
                                    setShowInlineCreate(false)
                                }}
                                className='px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm sm:text-base whitespace-nowrap'
                            >
                                <Plus className='w-4 h-4' />
                                <span className='hidden xs:inline'>새로 만들기</span>
                                <span className='xs:hidden'>만들기</span>
                            </button>
                        </div>
                    </div>

                    <div className='flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 overflow-x-auto pb-1 scrollbar-thin'>
                        <button
                            onClick={navigateToRoot}
                            className='hover:text-blue-600 flex items-center gap-1 flex-shrink-0'
                        >
                            <Home className='w-3 h-3 sm:w-4 sm:h-4' />
                        </button>
                        {breadcrumb.map((dir, index) => (
                            <div key={dir.uuid} className='flex items-center gap-1 sm:gap-2 flex-shrink-0'>
                                <ChevronRight className='w-3 h-3 sm:w-4 sm:h-4' />
                                <button
                                    onClick={() => navigateToDirectory(dir)}
                                    className='hover:text-blue-600 truncate max-w-[120px] sm:max-w-none'
                                >
                                    {dir.name}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='px-4 sm:px-6'>
                    {isLoading ? (
                        <div className='text-center py-12'>
                            <div className='text-gray-500'>로딩 중...</div>
                        </div>
                    ) : !filesData || filesData.items.length === 0 ? (
                        <div className='text-center py-12'>
                            <Folder className='w-16 h-16 mx-auto text-gray-300 mb-4' />
                            <div className='text-gray-500'>비어있는 디렉토리입니다.</div>
                        </div>
                    ) : (
                        <div className='overflow-x-auto overflow-y-visible -mx-4 sm:mx-0'>
                            <table className='w-full min-w-full'>
                                <thead className='bg-gray-50 border-b border-gray-200'>
                                    <tr>
                                        <th className='px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            이름
                                        </th>
                                        <th className='hidden md:table-cell px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            크기
                                        </th>
                                        <th className='hidden lg:table-cell px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            수정일
                                        </th>
                                        <th className='px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            작업
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    {filesData.items.map((item) => (
                                        <tr
                                            key={item.uuid}
                                            className={`hover:bg-gray-50 transition-colors ${
                                                selectedFileForDetail?.uuid === item.uuid ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <td
                                                className='px-3 sm:px-4 py-3 sm:py-4'
                                                onClick={() => renamingUuid !== item.uuid && handleItemClick(item)}
                                            >
                                                <div className='flex items-center gap-2 sm:gap-3 min-w-0'>
                                                    {item.type === 'directory' ? (
                                                        <Folder className='w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0' />
                                                    ) : (
                                                        <File className='w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0' />
                                                    )}
                                                    {renamingUuid === item.uuid ? (
                                                        <div
                                                            className='flex-1 flex items-center gap-2'
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <input
                                                                type='text'
                                                                value={renameValue}
                                                                onChange={(e) => setRenameValue(e.target.value)}
                                                                className='flex-1 px-2 py-1 text-xs sm:text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200'
                                                                data-rename-input={item.uuid}
                                                                onKeyDown={(e) => {
                                                                    if (
                                                                        e.key === 'Enter' &&
                                                                        !renameMutation.isPending
                                                                    ) {
                                                                        handleRename(item)
                                                                    } else if (e.key === 'Escape') {
                                                                        handleCancelRename()
                                                                    }
                                                                }}
                                                                onBlur={() =>
                                                                    !renameMutation.isPending && handleRename(item)
                                                                }
                                                                disabled={renameMutation.isPending}
                                                                autoFocus
                                                            />
                                                            {renameMutation.isPending && (
                                                                <Loader2 className='w-4 h-4 text-blue-600 animate-spin flex-shrink-0' />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span
                                                            className={`text-xs sm:text-sm font-medium truncate cursor-pointer ${
                                                                selectedFileForDetail?.uuid === item.uuid
                                                                    ? 'text-blue-600'
                                                                    : 'text-gray-900'
                                                            }`}
                                                        >
                                                            {item.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='hidden md:table-cell px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500'>
                                                {item.type === 'directory' ? '-' : formatFileSize(item.size)}
                                            </td>
                                            <td className='hidden lg:table-cell px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500'>
                                                {formatDate(item.updatedAt)}
                                            </td>
                                            <td className='px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                <div
                                                    className='relative flex items-center justify-end'
                                                    data-menu-uuid={item.uuid}
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            const btn = e.currentTarget as HTMLElement
                                                            const rect = btn.getBoundingClientRect()
                                                            const menuWidth = Math.min(256, window.innerWidth - 16)
                                                            const estimatedHeight = item.type === 'file' ? 84 : 44
                                                            const spaceBelow = window.innerHeight - rect.bottom
                                                            const openUp = spaceBelow < estimatedHeight + 12
                                                            const left = Math.min(
                                                                window.innerWidth - menuWidth - 8,
                                                                Math.max(8, rect.right - menuWidth),
                                                            )
                                                            const top = openUp
                                                                ? Math.max(8, rect.top - estimatedHeight - 8)
                                                                : rect.bottom + 8
                                                            setMenuPosition({ left, top })
                                                            setOpenMenuUuid((prev) =>
                                                                prev === item.uuid ? null : item.uuid,
                                                            )
                                                            setConfirmDeleteUuid(null)
                                                        }}
                                                        className='p-1.5 sm:p-2 hover:bg-gray-100 rounded touch-manipulation'
                                                        title='메뉴'
                                                    >
                                                        <MoreHorizontal className='w-4 h-4 sm:w-5 sm:h-5 text-gray-600' />
                                                    </button>

                                                    {openMenuUuid === item.uuid &&
                                                        createPortal(
                                                            <div
                                                                data-menu-popup={item.uuid}
                                                                className='fixed z-[9999] w-56 sm:w-64 bg-white border border-gray-200 rounded-md shadow-lg py-1'
                                                                style={{
                                                                    left: menuPosition.left,
                                                                    top: menuPosition.top,
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {confirmDeleteUuid !== item.uuid &&
                                                                    item.type === 'file' && (
                                                                        <button
                                                                            className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2'
                                                                            onClick={() => {
                                                                                handleDownload(item)
                                                                                setOpenMenuUuid(null)
                                                                            }}
                                                                        >
                                                                            <Download className='w-4 h-4 text-blue-600' />{' '}
                                                                            다운로드
                                                                        </button>
                                                                    )}
                                                                {confirmDeleteUuid !== item.uuid && (
                                                                    <button
                                                                        className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2'
                                                                        onClick={() => handleStartRename(item)}
                                                                    >
                                                                        <Edit className='w-4 h-4 text-gray-600' /> 이름
                                                                        변경
                                                                    </button>
                                                                )}
                                                                {confirmDeleteUuid !== item.uuid && (
                                                                    <div className='my-1 h-px bg-gray-100' />
                                                                )}
                                                                {confirmDeleteUuid === item.uuid ? (
                                                                    <div className='px-3 py-2'>
                                                                        <div className='flex items-start gap-2 p-2 rounded-md bg-red-50 border border-red-100'>
                                                                            <AlertTriangle className='w-4 h-4 text-red-600 mt-0.5' />
                                                                            <div className='text-xs text-red-700'>
                                                                                <div className='font-medium'>
                                                                                    정말 삭제할까요?
                                                                                </div>
                                                                                <div className='truncate text-[11px] text-red-600/80 mt-0.5'>
                                                                                    {item.name}
                                                                                </div>
                                                                                {item.type === 'directory' && (
                                                                                    <div className='text-[11px] mt-1'>
                                                                                        폴더 내 모든 항목도 함께
                                                                                        삭제됩니다.
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className='mt-2 flex justify-end gap-2'>
                                                                            <button
                                                                                className='h-8 px-3 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                                onClick={() =>
                                                                                    setConfirmDeleteUuid(null)
                                                                                }
                                                                                disabled={deleteMutation.isPending}
                                                                            >
                                                                                취소
                                                                            </button>
                                                                            <button
                                                                                className='h-8 px-3 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1'
                                                                                onClick={() => handleDelete(item)}
                                                                                disabled={deleteMutation.isPending}
                                                                            >
                                                                                {deleteMutation.isPending && (
                                                                                    <Loader2 className='w-3 h-3 animate-spin' />
                                                                                )}
                                                                                삭제
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        className='w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center gap-2'
                                                                        onClick={() => setConfirmDeleteUuid(item.uuid)}
                                                                    >
                                                                        <Trash2 className='w-4 h-4' /> 삭제
                                                                    </button>
                                                                )}
                                                            </div>,
                                                            document.body,
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {filesData && filesData.totalPages > 1 && (
                        <div className='flex justify-center flex-wrap gap-2 mt-4 sm:mt-6'>
                            {Array.from({ length: filesData.totalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`px-3 sm:px-4 py-2 rounded text-sm touch-manipulation ${
                                        p === page
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <input ref={fileInputRef} type='file' className='hidden' onChange={handleFileInputChange} />

            {openCreateMenu && (
                <div
                    data-create-menu-popup='true'
                    className='fixed z-[9999] w-64 sm:w-72 bg-white border border-gray-200 rounded-md shadow-lg py-2'
                    style={{ left: createMenuPos.left, top: createMenuPos.top }}
                >
                    {!showInlineCreate && (
                        <>
                            <button
                                className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2'
                                onClick={() => handleChooseFile()}
                                disabled={uploadFileMutation.isPending}
                            >
                                <Upload className='w-4 h-4 text-blue-600' /> 파일 업로드
                            </button>
                            {uploadFileMutation.isPending && (
                                <div className='px-3 pt-1 pb-2'>
                                    <div className='flex items-center gap-2 text-xs text-gray-600'>
                                        <Loader2 className='w-4 h-4 animate-spin text-blue-600' />
                                        업로드 중...
                                    </div>
                                </div>
                            )}
                            <button
                                className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2'
                                onClick={() => setShowInlineCreate(true)}
                            >
                                <FolderPlus className='w-4 h-4 text-gray-600' /> 폴더 생성
                            </button>
                        </>
                    )}

                    {showInlineCreate && (
                        <div className='px-3 pt-2'>
                            <div className='text-xs text-gray-600 mb-2'>새 폴더 이름</div>
                            <input
                                type='text'
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder='폴더 이름 입력'
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200'
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && !createFolderMutation.isPending && handleCreateFolder()
                                }
                                disabled={createFolderMutation.isPending}
                                autoFocus
                            />
                            <div className='mt-2 mb-1 flex justify-end gap-2'>
                                <button
                                    className='h-8 px-3 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    onClick={() => {
                                        setShowInlineCreate(false)
                                        setNewFolderName('')
                                    }}
                                    disabled={createFolderMutation.isPending}
                                >
                                    취소
                                </button>
                                <button
                                    className='h-8 px-3 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1'
                                    onClick={handleCreateFolder}
                                    disabled={!newFolderName.trim() || createFolderMutation.isPending}
                                >
                                    {createFolderMutation.isPending && <Loader2 className='w-3 h-3 animate-spin' />}
                                    생성
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className='fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-30 max-w-sm'>
                    <div className='rounded-lg border border-red-200 bg-white shadow-lg p-3 flex items-start gap-2'>
                        <AlertCircle className='w-5 h-5 text-red-600 mt-0.5 flex-shrink-0' />
                        <div className='text-xs sm:text-sm text-red-700 flex-1'>{error}</div>
                        <button
                            className='p-1 hover:bg-gray-100 rounded flex-shrink-0 touch-manipulation'
                            onClick={() => setError(null)}
                            title='닫기'
                        >
                            <XIcon className='w-4 h-4 text-gray-500' />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
