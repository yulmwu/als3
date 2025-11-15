'use client'

import { useAuth } from '../../context/AuthContext'
import { FolderOpen, Upload, Download, Shield, Zap, Cloud } from 'lucide-react'
import { useRouter } from 'next/navigation'

const MainPage = () => {
    const { user } = useAuth()
    const router = useRouter()

    return (
        <section className='w-full flex flex-col items-center py-16 px-5'>
            <div className='max-w-6xl w-full'>
                <div className='text-center mb-16'>
                    <p className='text-xl text-gray-600 mb-8'>A Lightweight STaaS (Storage as a Service)</p>
                    {user ? (
                        <button
                            onClick={() => router.push('/files')}
                            className='px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-lg font-semibold'
                        >
                            내 파일 관리하기
                        </button>
                    ) : (
                        <div className='flex gap-4 justify-center'>
                            <button
                                onClick={() => router.push('/login')}
                                className='px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-lg font-semibold'
                            >
                                시작하기
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

export { MainPage }
