'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    listFiles,
    createDirectory,
    uploadFile,
    deleteFile,
    getDownloadUrlByUuid,
    getBreadcrumb,
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
    const { user, loading: authLoading } = useAuth()
    const [page, setPage] = useState(1)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showUploadDialog, setShowUploadDialog] = useState(false)
    const [openMenuUuid, setOpenMenuUuid] = useState<string | null>(null)
    const [menuPosition, setMenuPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 })
    const [confirmDeleteUuid, setConfirmDeleteUuid] = useState<string | null>(null)
    const [selectedFileForDetail, setSelectedFileForDetail] = useState<FileItem | null>(null)
    const [newFolderName, setNewFolderName] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [breadcrumb, setBreadcrumb] = useState<FileItem[]>([])

    const queryClient = useQueryClient()

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/files')
        }
    }, [user, authLoading, router])

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
        if (!currentUuid) {
            setBreadcrumb([])
            return
        }

        const buildBreadcrumb = async (uuid: string) => {
            try {
                const trail = await getBreadcrumb(uuid)
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
            setShowCreateDialog(false)
            setNewFolderName('')
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
            setShowUploadDialog(false)
            setSelectedFile(null)
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

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            setError(null)
            createFolderMutation.mutate(newFolderName.trim())
        }
    }

    const handleUploadFile = () => {
        if (selectedFile) {
            setError(null)
            uploadFileMutation.mutate(selectedFile)
        }
    }

    const handleDelete = (item: FileItem) => {
        setError(null)
        setOpenMenuUuid(null)
        deleteMutation.mutate(item.id)
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

    if (authLoading) {
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
        <div className='max-w-7xl mx-auto p-6'>
            <div className='bg-white rounded-lg shadow'>
                <div className='p-6 border-b border-gray-200'>
                    <div className='flex items-center justify-between mb-4'>
                        <h1 className='text-2xl font-bold text-gray-900'>내 파일</h1>
                        <div className='flex gap-2'>
                            <button
                                onClick={() => setShowUploadDialog(true)}
                                className='px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2'
                            >
                                <Upload className='w-4 h-4' />
                                파일 업로드
                            </button>
                            <button
                                onClick={() => setShowCreateDialog(true)}
                                className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2'
                            >
                                <FolderPlus className='w-4 h-4' />
                                폴더 생성
                            </button>
                        </div>
                    </div>

                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                        <button onClick={navigateToRoot} className='hover:text-blue-600 flex items-center gap-1'>
                            <Home className='w-4 h-4' />
                        </button>
                        {breadcrumb.map((dir, index) => (
                            <div key={dir.uuid} className='flex items-center gap-2'>
                                <ChevronRight className='w-4 h-4' />
                                <button onClick={() => navigateToDirectory(dir)} className='hover:text-blue-600'>
                                    {dir.name}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='p-6'>
                    {isLoading ? (
                        <div className='text-center py-12'>
                            <div className='text-gray-500'>로딩 중...</div>
                        </div>
                    ) : !filesData || filesData.items.length === 0 ? (
                        <div className='text-center py-12'>
                            <Folder className='w-16 h-16 mx-auto text-gray-300 mb-4' />
                            <div className='text-gray-500'>이 폴더는 비어있습니다</div>
                        </div>
                    ) : (
                        <div className='overflow-x-auto overflow-y-visible'>
                            <table className='w-full'>
                                <thead className='bg-gray-50 border-b border-gray-200'>
                                    <tr>
                                        <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            이름
                                        </th>
                                        <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            크기
                                        </th>
                                        <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            수정일
                                        </th>
                                        <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
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
                                                className='px-4 py-4 whitespace-nowrap cursor-pointer'
                                                onClick={() => handleItemClick(item)}
                                            >
                                                <div className='flex items-center gap-3'>
                                                    {item.type === 'directory' ? (
                                                        <Folder className='w-5 h-5 text-blue-500' />
                                                    ) : (
                                                        <File className='w-5 h-5 text-gray-400' />
                                                    )}
                                                    <span
                                                        className={`text-sm font-medium ${
                                                            selectedFileForDetail?.uuid === item.uuid
                                                                ? 'text-blue-600'
                                                                : 'text-gray-900'
                                                        }`}
                                                    >
                                                        {item.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                                                {item.type === 'directory' ? '-' : formatFileSize(item.size)}
                                            </td>
                                            <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                                                {formatDate(item.updatedAt)}
                                            </td>
                                            <td className='px-4 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                                <div
                                                    className='relative flex items-center justify-end'
                                                    data-menu-uuid={item.uuid}
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            const btn = e.currentTarget as HTMLElement
                                                            const rect = btn.getBoundingClientRect()
                                                            const menuWidth = 256
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
                                                        className='p-2 hover:bg-gray-100 rounded'
                                                        title='메뉴'
                                                    >
                                                        <MoreHorizontal className='w-5 h-5 text-gray-600' />
                                                    </button>

                                                    {openMenuUuid === item.uuid &&
                                                        createPortal(
                                                            <div
                                                                data-menu-popup={item.uuid}
                                                                className='fixed z-[9999] w-64 bg-white border border-gray-200 rounded-md shadow-lg py-1'
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
                        <div className='flex justify-center gap-2 mt-6'>
                            {Array.from({ length: filesData.totalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`px-4 py-2 rounded ${
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

            {showCreateDialog && (
                <div className='fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50'>
                    <div className='bg-white rounded-lg p-6 w-full max-w-md shadow-xl'>
                        <h2 className='text-xl font-bold mb-4'>폴더 생성</h2>
                        {error && (
                            <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700'>
                                <AlertCircle className='w-5 h-5 flex-shrink-0' />
                                <span className='text-sm'>{error}</span>
                            </div>
                        )}
                        <input
                            type='text'
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder='폴더 이름'
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500'
                            onKeyDown={(e) =>
                                e.key === 'Enter' && !createFolderMutation.isPending && handleCreateFolder()
                            }
                            disabled={createFolderMutation.isPending}
                        />
                        <div className='flex justify-end gap-2'>
                            <button
                                onClick={() => {
                                    setShowCreateDialog(false)
                                    setNewFolderName('')
                                    setError(null)
                                }}
                                className='px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300'
                                disabled={createFolderMutation.isPending}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                disabled={!newFolderName.trim() || createFolderMutation.isPending}
                                className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2'
                            >
                                {createFolderMutation.isPending && <Loader2 className='w-4 h-4 animate-spin' />}
                                생성
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showUploadDialog && (
                <div className='fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50'>
                    <div className='bg-white rounded-lg p-6 w-full max-w-md shadow-xl'>
                        <h2 className='text-xl font-bold mb-4'>파일 업로드</h2>
                        {error && (
                            <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700'>
                                <AlertCircle className='w-5 h-5 flex-shrink-0' />
                                <span className='text-sm'>{error}</span>
                            </div>
                        )}
                        <input
                            type='file'
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            disabled={uploadFileMutation.isPending}
                        />
                        {selectedFile && (
                            <div className='text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg'>
                                <div className='font-medium'>선택된 파일:</div>
                                <div className='mt-1'>{selectedFile.name}</div>
                                <div className='text-xs text-gray-500 mt-1'>
                                    크기: {formatFileSize(selectedFile.size)}
                                </div>
                            </div>
                        )}
                        {uploadFileMutation.isPending && (
                            <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-700'>
                                <Loader2 className='w-5 h-5 flex-shrink-0 animate-spin' />
                                <span className='text-sm'>업로드 중...</span>
                            </div>
                        )}
                        <div className='flex justify-end gap-2'>
                            <button
                                onClick={() => {
                                    setShowUploadDialog(false)
                                    setSelectedFile(null)
                                    setError(null)
                                }}
                                className='px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300'
                                disabled={uploadFileMutation.isPending}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleUploadFile}
                                disabled={!selectedFile || uploadFileMutation.isPending}
                                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2'
                            >
                                {uploadFileMutation.isPending && <Loader2 className='w-4 h-4 animate-spin' />}
                                업로드
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error && !showCreateDialog && !showUploadDialog && (
                <div className='fixed bottom-6 right-6 z-30 max-w-sm'>
                    <div className='rounded-lg border border-red-200 bg-white shadow-lg p-3 flex items-start gap-2'>
                        <AlertCircle className='w-5 h-5 text-red-600 mt-0.5' />
                        <div className='text-sm text-red-700 flex-1'>{error}</div>
                        <button className='p-1 hover:bg-gray-100 rounded' onClick={() => setError(null)} title='닫기'>
                            <XIcon className='w-4 h-4 text-gray-500' />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
