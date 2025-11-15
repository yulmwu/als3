import React, { useState } from 'react'
import { useForm } from '@/app/hooks/useForm'
import { useAuth } from '@/app/context/AuthContext'
import AuthForm from './AuthForm'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface RegisterFormProps {
    onSuccess?: () => void
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
    const { register, loading } = useAuth()
    const { values, errors, handleChange, setFieldError, reset } = useForm({
        username: '',
        nickname: '',
        email: '',
        password: '',
        confirmPassword: '',
    })
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const validate = () => {
        let valid = true
        if (!values.username) {
            setFieldError('username', '이름을 입력하세요.')
            valid = false
        }

        if (!values.nickname) {
            setFieldError('nickname', '닉네임을 입력하세요.')
            valid = false
        }

        if (!values.email || !/^[^@]+@[^@]+\.[^@]+$/.test(values.email)) {
            setFieldError('email', '유효한 이메일을 입력하세요.')
            valid = false
        }

        if (values.password !== values.confirmPassword) {
            setFieldError('confirmPassword', '비밀번호가 일치하지 않습니다.')
            valid = false
        }
        return valid
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return
        setError(null)
        setSuccess(false)
        const result = await register({
            username: values.username,
            nickname: values.nickname,
            email: values.email,
            password: values.password,
        })
        if (!result.ok) {
            setError(result.error.message || '회원가입에 실패했습니다.')
            return
        }
        setSuccess(true)
        reset()
        setTimeout(() => {
            if (onSuccess) onSuccess()
        }, 2000)
    }

    return (
        <>
            {error && (
                <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700'>
                    <AlertCircle className='w-5 h-5 flex-shrink-0' />
                    <span className='text-sm'>{error}</span>
                </div>
            )}
            {success && (
                <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700'>
                    <CheckCircle className='w-5 h-5 flex-shrink-0' />
                    <span className='text-sm'>회원가입이 완료되었습니다. 로그인 페이지로 이동합니다...</span>
                </div>
            )}
            <AuthForm
                title='회원가입'
                onSubmit={handleSubmit}
                submitLabel='회원가입'
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
                        name: 'nickname',
                        placeholder: '닉네임',
                        value: values.nickname,
                        onChange: handleChange,
                        error: errors.nickname,
                    },
                    {
                        name: 'email',
                        placeholder: '이메일',
                        value: values.email,
                        onChange: handleChange,
                        error: errors.email,
                    },
                    {
                        name: 'password',
                        type: 'password',
                        placeholder: '비밀번호',
                        value: values.password,
                        onChange: handleChange,
                        error: errors.password,
                    },
                    {
                        name: 'confirmPassword',
                        type: 'password',
                        placeholder: '비밀번호 확인',
                        value: values.confirmPassword,
                        onChange: handleChange,
                        error: errors.confirmPassword,
                    },
                ]}
            />
        </>
    )
}
