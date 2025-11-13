'use client'

import { Suspense, useState } from 'react'
import { FilesManager } from '../components/Files/FilesManager'
import { FileDetailSidebar } from '../components/Files/FileDetailSidebar'
import { Header } from '../components/Header'
import { LeftSidebar } from '../components/LeftSidebar'
import { FileItem, getDownloadUrl } from '@/api/files'

const FilesPage = () => {
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

    const handleDownload = async (file: FileItem) => {
        try {
            const data = await getDownloadUrl(file.id)
            if (data.downloadUrl) {
                window.open(data.downloadUrl, '_blank')
            }
        } catch (error) {
            console.error('Download failed:', error)
        }
    }

    return (
        <>
            <Header />
            <div className='flex min-h-screen bg-gray-50'>
                <LeftSidebar
                    currentItem='files'
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
                <main className='flex-1'>
                    <Suspense fallback={<div className='p-6 text-center'>로딩 중...</div>}>
                        <FilesManager onFileSelect={setSelectedFile} onDownload={handleDownload} />
                    </Suspense>
                </main>
                <FileDetailSidebar
                    file={selectedFile}
                    onClose={() => setSelectedFile(null)}
                    onDownload={handleDownload}
                />
            </div>
        </>
    )
}

export default FilesPage
