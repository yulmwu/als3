'use client'

import { Suspense, useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { FilesManager } from '../../components/Files/FilesManager'
import { FileDetailSidebar } from '../../components/Files/FileDetailSidebar'
import { PageLayout } from '../../components/PageLayout'
import { FileItem, getDownloadUrlByUuid, getFileByUuid } from '@/api/files'

const FilesPage = () => {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)

    const currentUuid = params.uuid as string | undefined
    const selectedFileUuid = searchParams.get('f')

    useEffect(() => {
        if (selectedFileUuid) {
            getFileByUuid(selectedFileUuid)
                .then(setSelectedFile)
                .catch((error) => {
                    console.error('Failed to load selected file:', error)
                    setSelectedFile(null)
                })
        } else {
            setSelectedFile(null)
        }
    }, [selectedFileUuid])

    const handleFileSelect = (file: FileItem | null) => {
        setSelectedFile(file)

        if (file) {
            const newUrl = currentUuid ? `/files/${currentUuid}?f=${file.uuid}` : `/files?f=${file.uuid}`
            router.replace(newUrl, { scroll: false })
        } else {
            const newUrl = currentUuid ? `/files/${currentUuid}` : '/files'
            router.replace(newUrl, { scroll: false })
        }
    }

    const handleDownload = async (file: FileItem) => {
        try {
            const data = await getDownloadUrlByUuid(file.uuid)
            if (data.downloadUrl) {
                window.open(data.downloadUrl, '_blank')
            }
        } catch (error) {
            console.error('Download failed:', error)
        }
    }

    return (
        <PageLayout currentItem='files'>
            <div className='flex'>
                <main className='flex-1'>
                    <Suspense fallback={<div className='p-6 text-center'>로딩 중...</div>}>
                        <FilesManager
                            currentUuid={currentUuid}
                            onFileSelect={handleFileSelect}
                            onDownload={handleDownload}
                        />
                    </Suspense>
                </main>
                <FileDetailSidebar
                    file={selectedFile}
                    onClose={() => handleFileSelect(null)}
                    onDownload={handleDownload}
                />
            </div>
        </PageLayout>
    )
}

export default FilesPage
