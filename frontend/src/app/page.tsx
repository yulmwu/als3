'use client'

import { MainPage } from './components/Main'
import { PageLayout } from './components/PageLayout'

const Home = () => (
    <PageLayout currentItem='home'>
        <MainPage />
    </PageLayout>
)

export default Home
