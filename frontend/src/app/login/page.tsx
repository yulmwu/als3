'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import LoginForm from '@/app/components/Auth/LoginForm'
import Link from 'next/link'

function LoginContent() {
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
        <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
            <div className='w-full max-w-md'>
                <div className='text-center mb-8'>
                    <Link href='/' className='inline-flex items-center space-x-2'>
                        <div className='w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center'>
                            <span className='text-white font-bold text-xl'>7</span>
                        </div>
                        <span className='text-3xl font-bold text-slate-600'>0725</span>
                    </Link>
                    <h1 className='text-2xl font-bold text-gray-900 mt-6'>로그인</h1>
                    <p className='text-gray-600 mt-2'>계정에 로그인하세요</p>
                </div>

                <div className='bg-white rounded-lg shadow-lg p-8'>
                    <LoginForm
                        onSuccess={() => {
                            router.push(redirect)
                        }}
                    />

                    <div className='mt-6 text-center text-sm text-gray-600'>
                        계정이 없으신가요?{' '}
                        <Link
                            href={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                            className='text-blue-600 hover:text-blue-700 font-medium'
                        >
                            회원가입
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className='min-h-screen flex items-center justify-center bg-gray-50'>
                    <div className='text-gray-500'>로딩 중...</div>
                </div>
            }
        >
            <LoginContent />
        </Suspense>
    )
}
