'use client'

import { FileItem } from '@/api/files'
import { File, Folder, Download, Calendar, Clock, HardDrive, User, X } from 'lucide-react'

interface FileDetailSidebarProps {
    file: FileItem | null
    onClose: () => void
    onDownload: (file: FileItem) => void
}

export const FileDetailSidebar = ({ file, onClose, onDownload }: FileDetailSidebarProps) => {
    if (!file) {
        return null
    }

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '-'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const getFileExtension = (name: string) => {
        const parts = name.split('.')
        return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '파일'
    }

    return (
        <aside className='hidden lg:block md:w-80 bg-white border-l border-gray-200 sticky top-14 h-[calc(100vh-4rem)] overflow-y-auto'>
            <section className='p-4'>
                <div className='flex items-center justify-between mb-4'>
                    <span className='text-lg font-bold text-slate-700'>파일 정보</span>
                    <button
                        onClick={onClose}
                        className='p-1 hover:bg-gray-100 rounded-full transition-colors'
                        aria-label='닫기'
                    >
                        <X className='w-5 h-5 text-gray-500' />
                    </button>
                </div>

                <div className='space-y-6'>
                    <div className='flex flex-col items-center py-6 bg-gray-50 rounded-lg'>
                        {file.type === 'directory' ? (
                            <Folder className='w-20 h-20 text-blue-500 mb-3' />
                        ) : (
                            <File className='w-20 h-20 text-gray-400 mb-3' />
                        )}
                        <h3 className='font-semibold text-center text-gray-900 break-words max-w-full px-2'>
                            {file.name}
                        </h3>
                        {file.type === 'file' && (
                            <span className='text-xs text-gray-500 mt-1'>{getFileExtension(file.name)}</span>
                        )}
                    </div>

                    {file.type === 'file' && (
                        <button
                            onClick={() => onDownload(file)}
                            className='w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors'
                        >
                            <Download className='w-5 h-5' />
                            <span className='font-medium'>다운로드</span>
                        </button>
                    )}

                    <div className='space-y-4 text-sm'>
                        <div className='border-t border-gray-200 pt-4'>
                            <h4 className='font-semibold text-gray-900 mb-3'>상세 정보</h4>

                            <div className='space-y-3'>
                                <div className='flex items-start gap-3'>
                                    <div className='mt-0.5'>
                                        {file.type === 'directory' ? (
                                            <Folder className='w-4 h-4 text-gray-400' />
                                        ) : (
                                            <File className='w-4 h-4 text-gray-400' />
                                        )}
                                    </div>
                                    <div className='flex-1'>
                                        <div className='text-gray-500 text-xs'>타입</div>
                                        <div className='text-gray-900'>
                                            {file.type === 'directory' ? '폴더' : '파일'}
                                        </div>
                                    </div>
                                </div>

                                {file.type === 'file' && (
                                    <div className='flex items-start gap-3'>
                                        <div className='mt-0.5'>
                                            <HardDrive className='w-4 h-4 text-gray-400' />
                                        </div>
                                        <div className='flex-1'>
                                            <div className='text-gray-500 text-xs'>크기</div>
                                            <div className='text-gray-900'>{formatFileSize(file.size)}</div>
                                        </div>
                                    </div>
                                )}

                                <div className='flex items-start gap-3'>
                                    <div className='mt-0.5'>
                                        <Folder className='w-4 h-4 text-gray-400' />
                                    </div>
                                    <div className='flex-1'>
                                        <div className='text-gray-500 text-xs'>위치</div>
                                        <div className='text-gray-900 break-words'>{file.path || '/'}</div>
                                    </div>
                                </div>

                                <div className='flex items-start gap-3'>
                                    <div className='mt-0.5'>
                                        <Calendar className='w-4 h-4 text-gray-400' />
                                    </div>
                                    <div className='flex-1'>
                                        <div className='text-gray-500 text-xs'>생성일</div>
                                        <div className='text-gray-900'>{formatDate(file.createdAt)}</div>
                                    </div>
                                </div>

                                <div className='flex items-start gap-3'>
                                    <div className='mt-0.5'>
                                        <Clock className='w-4 h-4 text-gray-400' />
                                    </div>
                                    <div className='flex-1'>
                                        <div className='text-gray-500 text-xs'>수정일</div>
                                        <div className='text-gray-900'>{formatDate(file.updatedAt)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </aside>
    )
}
