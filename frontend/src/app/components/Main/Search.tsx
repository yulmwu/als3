'use client'

import { useState } from 'react'

export interface SearchValues {
    query: string
    author?: string
    topic?: string
}

interface SearchBarProps {
    onSearch: (values: SearchValues) => void
}

const SearchBar = (props: SearchBarProps) => {
    const [simpleSearch, setSimpleSearch] = useState('')

    const [search, setSearch] = useState('')
    const [author, setAuthor] = useState('')
    const [topic, setTopic] = useState('')

    const showOptions = simpleSearch.trim().startsWith('/?')

    const getSearchValues = (): SearchValues => {
        let trimmedAuthor: string | undefined = author.trim()
        let trimmedTopic: string | undefined = topic.trim()

        if (trimmedAuthor.length <= 0) trimmedAuthor = undefined
        if (trimmedTopic.length <= 0) trimmedTopic = undefined

        if (showOptions) {
            return { query: search.trim(), author: trimmedAuthor, topic: trimmedTopic }
        }
        return { query: simpleSearch.trim(), author: trimmedAuthor, topic: trimmedTopic }
    }

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && simpleSearch.trim() && !showOptions) {
            props.onSearch(getSearchValues())
        }
    }

    return (
        <div className='w-full max-w-4xl flex flex-col items-center mb-30 relative'>
            <input
                type='text'
                value={simpleSearch}
                onChange={(e) => setSimpleSearch(e.target.value)}
                placeholder='검색어를 입력하거나 /? 를 입력하여 자세히 검색해보세요.'
                className='w-full h-20 px-6 py-4 rounded-2xl border border-gray-300 shadow focus:outline-none hover:scale-101 transition-transform duration-200'
                onKeyDown={handleSearch}
            />

            <div
                className={`absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50 transition-all duration-300 ease-in-out ${
                    showOptions
                        ? 'opacity-100 translate-y-2 pointer-events-auto'
                        : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
            >
                <div className='flex flex-col gap-3'>
                    <div>
                        <label className='block text-sm font-medium text-gray-800 m-1'>검색어</label>
                        <input
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='검색어 입력'
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-slate-200'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-600 m-1'>작성자 이름</label>
                        <input
                            type='text'
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder='작성자 입력'
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-slate-200'
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-600 m-1'>토픽 이름</label>
                        <input
                            type='text'
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder='토픽 입력'
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-slate-200'
                        />
                    </div>

                    <button
                        onClick={() => props.onSearch(getSearchValues())}
                        className='w-full py-2 mt-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition'
                    >
                        검색
                    </button>
                </div>
            </div>
        </div>
    )
}

export { SearchBar }
