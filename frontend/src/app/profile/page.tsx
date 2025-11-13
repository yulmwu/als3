'use client'

import { useAuth } from '@/app/context/AuthContext'
import { PageLayout } from '../components/PageLayout'
import UserCard from './UserCard'

const ProfilePage = () => {
    const { user } = useAuth()

    return (
        <PageLayout currentItem='profile'>
            <div className='max-w-5xl mx-auto p-6'>
                <UserCard />
            </div>
        </PageLayout>
    )
}

export default ProfilePage
