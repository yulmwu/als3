'use client'

import { useAuth } from '../../context/AuthContext'
import { FolderOpen, Upload, Download, Shield, Zap, Cloud } from 'lucide-react'
import { useRouter } from 'next/navigation'

const MainPage = () => {
    const { user } = useAuth()
    const router = useRouter()

    const features = [
        {
            icon: Cloud,
            title: '클라우드 스토리지',
            description: 'AWS S3 기반의 안전하고 빠른 클라우드 스토리지 서비스',
        },
        {
            icon: FolderOpen,
            title: '폴더 구조',
            description: '직관적인 폴더 구조로 파일을 체계적으로 관리',
        },
        {
            icon: Upload,
            title: '간편한 업로드',
            description: '드래그 앤 드롭으로 파일을 빠르게 업로드',
        },
        {
            icon: Download,
            title: '빠른 다운로드',
            description: 'Presigned URL로 안전하고 빠른 파일 다운로드',
        },
        {
            icon: Shield,
            title: '보안',
            description: 'JWT 인증과 사용자별 격리된 스토리지 공간',
        },
        {
            icon: Zap,
            title: '고성능',
            description: 'AWS S3의 고성능 인프라 활용',
        },
    ]

    return (
        <section className='w-full flex flex-col items-center py-16 px-5'>
            <div className='max-w-6xl w-full'>
                <div className='text-center mb-16'>
                    <h1 className='text-5xl font-bold text-gray-900 mb-4'>ALS3</h1>
                    <p className='text-xl text-gray-600 mb-8'>A Lightweight STaaS (Storage as a Service)</p>
                    <p className='text-lg text-gray-500 mb-8'>
                        AWS S3 기반의 간편하고 안전한 클라우드 파일 스토리지 서비스
                    </p>
                    {user ? (
                        <button
                            onClick={() => router.push('/files')}
                            className='px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-semibold'
                        >
                            내 파일 관리하기
                        </button>
                    ) : (
                        <div className='flex gap-4 justify-center'>
                            <button
                                onClick={() => router.push('/profile')}
                                className='px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-semibold'
                            >
                                시작하기
                            </button>
                        </div>
                    )}
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16'>
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className='bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow'
                        >
                            <div className='flex items-center mb-4'>
                                <div className='p-3 bg-blue-100 rounded-lg'>
                                    <feature.icon className='w-6 h-6 text-blue-600' />
                                </div>
                            </div>
                            <h3 className='text-xl font-semibold text-gray-900 mb-2'>{feature.title}</h3>
                            <p className='text-gray-600'>{feature.description}</p>
                        </div>
                    ))}
                </div>

                <div className='mt-16 bg-gray-50 rounded-lg p-8'>
                    <h2 className='text-2xl font-bold text-gray-900 mb-4 text-center'>주요 기능</h2>
                    <div className='space-y-4 text-gray-700'>
                        <div className='flex items-start gap-3'>
                            <div className='w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1'>
                                ✓
                            </div>
                            <div>
                                <strong>파일 업로드 및 다운로드:</strong> 최대 100MB 크기의 파일을 업로드하고 언제든지
                                다운로드
                            </div>
                        </div>
                        <div className='flex items-start gap-3'>
                            <div className='w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1'>
                                ✓
                            </div>
                            <div>
                                <strong>폴더 관리:</strong> 계층적 폴더 구조로 파일을 체계적으로 정리
                            </div>
                        </div>
                        <div className='flex items-start gap-3'>
                            <div className='w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1'>
                                ✓
                            </div>
                            <div>
                                <strong>안전한 스토리지:</strong> 사용자별로 격리된 스토리지 공간과 JWT 인증
                            </div>
                        </div>
                        <div className='flex items-start gap-3'>
                            <div className='w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1'>
                                ✓
                            </div>
                            <div>
                                <strong>빠른 성능:</strong> AWS S3의 안정적이고 빠른 인프라 활용
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export { MainPage }
