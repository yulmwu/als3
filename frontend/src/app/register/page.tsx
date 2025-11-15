'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import RegisterForm from '@/app/components/Auth/RegisterForm'
import Link from 'next/link'

function RegisterContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, loading } = useAuth()
    const redirect = searchParams.get('redirect') || '/'

    useEffect(() => {
        if (!loading && user) {
            router.push(redirect)
        }
    }, [user, loading, redirect, router])

    if (loading) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-gray-50'>
                <div className='text-gray-500'>로딩 중...</div>
            </div>
        )
    }

    if (user) {
        return null
    }

    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12'>
            <div className='w-full max-w-md'>
                <div className='bg-white rounded-lg shadow-lg p-8'>
                    <RegisterForm
                        onSuccess={() => {
                            router.push(`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`)
                        }}
                    />

                    <div className='mt-6 text-center text-sm text-gray-600'>
                        이미 계정이 있으신가요?{' '}
                        <Link
                            href={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                            className='text-blue-600 hover:text-blue-700 font-medium'
                        >
                            로그인
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className='min-h-screen flex items-center justify-center bg-gray-50'>
                    <div className='text-gray-500'>로딩 중...</div>
                </div>
            }
        >
            <RegisterContent />
        </Suspense>
    )
}
