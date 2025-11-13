import { useEffect, useMemo, useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'
import AuthModal from '../components/Auth/AuthModal'
import LoginForm from '../components/Auth/LoginForm'
import RegisterForm from '../components/Auth/RegisterForm'
import { formatDate } from '@/utils/dateFormatter'
import { updateUser, UserResponse } from '@/api/users'
import { GetMeResponse } from '@/api/auth'

type Mode = 'self' | 'other'

interface Props {
    user?: UserResponse
    mode?: Mode
    onFollow?: () => void
    onUnfollow?: () => void
    loading?: boolean
}

const UserCard = ({ user: externalUser, mode, onFollow, onUnfollow, loading }: Props) => {
    const { user: me, loading: authLoading, setUser } = useAuth()
    const [modal, setModal] = useState<'login' | 'register' | null>(null)

    const isSelf: boolean = useMemo(() => {
        if (mode === 'self') return true
        else if (mode === 'other') return false

        return !externalUser
    }, [mode, externalUser, me])

    const target = isSelf ? me : externalUser

    const [editMode, setEditMode] = useState(false)
    const [nickname, setNickname] = useState(target?.nickname ?? null)
    const [description, setDescription] = useState(target?.description ?? null)
    const [error, setError] = useState('')

    useEffect(() => {
        setNickname(target?.nickname ?? null)
        setDescription(target?.description ?? null)
    }, [target?.nickname, target?.description])

    const handleSubmit = async () => {
        if (!isSelf || !me) return
        setError('')

        if (nickname?.trim() === '') setNickname(null)
        if (description?.trim() === '') setDescription(null)

        try {
            const updatedUser = await updateUser(me.username, {
                nickname: nickname || undefined,
                description: description || undefined,
            })
            setUser({ ...me, ...updatedUser } as GetMeResponse)
            setEditMode(false)
        } catch {
            setError('Failed to update profile')
        }
    }

    const handleCancel = () => {
        setEditMode(false)
        setNickname(target?.nickname ?? '')
        setDescription(target?.description ?? '')
        setError('')
    }

    const isLoading = loading || authLoading
    const canShowFollowButton = !isSelf && !!me && !!target && target.username !== me.username

    return (
        <div className='relative w-full max-w-5xl mx-auto my-10'>
            <div className='bg-white rounded-2xl border border-gray-200 flex items-center justify-center min-h-[180px] px-6 py-4'>
                {isLoading ? (
                    <div className='text-gray-400'>로딩중...</div>
                ) : !target ? (
                    <div className='text-gray-400'>사용자를 찾을 수 없습니다.</div>
                ) : (
                    <div className='flex items-center w-full h-full md:m-4'>
                        <div className='flex flex-col w-full'>
                            <div className='flex items-center mb-6 relative'>
                                <div className='w-18 h-18 xl:w-24 xl:h-24 rounded-full bg-slate-200 flex items-center justify-center text-lg xl:text-2xl font-bold text-slate-500 shrink-0'>
                                    {(isSelf ? (nickname ?? target.username) : (target.nickname ?? target.username))
                                        ?.charAt(0)
                                        .toUpperCase() || '?'}
                                </div>

                                <div className='ml-6 flex flex-col flex-1'>
                                    <div className='text-2xl font-semibold flex flex-wrap items-center break-words min-w-0'>
                                        {isSelf && editMode ? (
                                            <input
                                                type='text'
                                                className='bg-transparent outline-none text-xl font-semibold w-full px-0 py-0 border-b border-gray-300 focus:border-slate-800 transition break-words'
                                                style={{ boxShadow: 'none' }}
                                                value={nickname ?? ''}
                                                onChange={(e) => setNickname(e.target.value)}
                                                maxLength={32}
                                                autoFocus
                                                placeholder='닉네임을 입력하세요'
                                            />
                                        ) : (isSelf ? nickname : target.nickname) ? (
                                            <>
                                                <span className='break-words'>
                                                    {(isSelf ? nickname : target.nickname) as string}
                                                </span>
                                                <span className='text-lg text-gray-500 ml-2 break-words'>
                                                    (@{target.username})
                                                </span>
                                            </>
                                        ) : (
                                            <span className='break-words'>@{target.username}</span>
                                        )}
                                    </div>

                                    <div className='mt-2 leading-snug break-words whitespace-normal min-w-0'>
                                        {isSelf && editMode ? (
                                            <input
                                                type='text'
                                                className='bg-transparent outline-none text-base w-full px-0 py-0 border-b border-gray-300 focus:border-slate-800 transition break-words'
                                                style={{ boxShadow: 'none' }}
                                                value={description ?? ''}
                                                onChange={(e) => setDescription(e.target.value)}
                                                maxLength={255}
                                                placeholder='자기소개를 입력하세요.'
                                            />
                                        ) : target.description ? (
                                            <span className='text-gray-600 break-words'>{target.description}</span>
                                        ) : (
                                            <span className='text-gray-400'>자기소개가 없습니다.</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isSelf && (
                                <div className='absolute top-2 right-2 flex gap-2 z-10'>
                                    {editMode ? (
                                        <>
                                            <button
                                                className='p-2 ml-1 rounded-full hover:bg-gray-100 text-slate-800 transition'
                                                title='저장'
                                                onClick={handleSubmit}
                                            >
                                                <Check className='w-5 h-5' />
                                            </button>
                                            <button
                                                className='p-2 rounded-full hover:bg-gray-100 text-gray-600 transition'
                                                title='취소'
                                                onClick={handleCancel}
                                            >
                                                <X className='w-5 h-5' />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className='p-2 rounded-full hover:bg-slate-100 text-slate-500 transition'
                                            title='수정하기'
                                            onClick={() => setEditMode(true)}
                                        >
                                            <Pencil className='w-5 h-5' />
                                        </button>
                                    )}
                                </div>
                            )}

                            {error && <div className='text-red-500 mb-2'>{error}</div>}

                            <div className='ml-0 md:ml-4 grid grid-cols-[100px_1fr] gap-y-2 text-gray-700 text-sm'>
                                <span className='text-gray-500'>이메일</span>
                                <span>{target.email}</span>

                                <span className='text-gray-500'>역할</span>
                                <span>{target.role === 0 ? '관리자' : '일반 사용자'}</span>

                                <span className='text-gray-500'>가입일</span>
                                <span>{formatDate(target.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AuthModal visible={modal === 'login'} onHide={() => setModal(null)}>
                <LoginForm onSuccess={() => setModal(null)} />
                <div className='flex justify-center mt-4 text-sm text-gray-500'>
                    <button className='hover:underline text-slate-600' onClick={() => setModal('register')}>
                        회원가입
                    </button>
                </div>
            </AuthModal>

            <AuthModal visible={modal === 'register'} onHide={() => setModal(null)}>
                <RegisterForm onSuccess={() => setModal('login')} />
                <div className='flex justify-center mt-4 text-sm text-gray-500'>
                    <button className='hover:underline text-slate-600' onClick={() => setModal('login')}>
                        로그인
                    </button>
                </div>
            </AuthModal>
        </div>
    )
}

export default UserCard
