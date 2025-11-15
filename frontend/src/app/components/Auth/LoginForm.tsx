import React, { useState } from 'react'
import { useForm } from '@/app/hooks/useForm'
import { useAuth } from '@/app/context/AuthContext'
import AuthForm from './AuthForm'
import { AlertCircle } from 'lucide-react'

interface LoginFormProps {
    onSuccess?: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
    const { login, loading } = useAuth()
    const { values, errors, handleChange, setFieldError, reset } = useForm({
        username: '',
        password: '',
    })
    const [error, setError] = useState<string | null>(null)

    const validate = () => {
        let valid = true
        if (!values.username) {
            setFieldError('username', '아이디를 입력하세요.')
            valid = false
        }
        if (!values.password) {
            setFieldError('password', '비밀번호를 입력하세요.')
            valid = false
        }
        return valid
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return
        setError(null)
        const result = await login(values.username, values.password)
        if (!result.ok) {
            setError(result.error.message || '로그인에 실패했습니다.')
            return
        }
        reset()
        if (onSuccess) onSuccess()
    }

    return (
        <>
            {error && (
                <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700'>
                    <AlertCircle className='w-5 h-5 flex-shrink-0' />
                    <span className='text-sm'>{error}</span>
                </div>
            )}
            <AuthForm
                title='로그인'
                onSubmit={handleSubmit}
                submitLabel='로그인'
                loading={loading}
                fields={[
                    {
                        name: 'username',
                        placeholder: '아이디',
                        value: values.username,
                        onChange: handleChange,
                        error: errors.username,
                    },
                    {
                        name: 'password',
                        type: 'password',
                        placeholder: '비밀번호',
                        value: values.password,
                        onChange: handleChange,
                        error: errors.password,
                    },
                ]}
            />
        </>
    )
}
