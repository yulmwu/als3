import React from 'react'

interface AuthFormProps {
    title: string
    onSubmit: (e: React.FormEvent) => void
    fields: Array<{
        name: string
        type?: string
        placeholder: string
        value: string
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
        error?: string
    }>
    submitLabel: string
    loading?: boolean
    children?: React.ReactNode
}

export default function AuthForm(props: AuthFormProps) {
    return (
        <div className='max-w-md mx-auto p-2 mt-10'>
            <h2 className='text-3xl font-bold mb-8 text-center tracking-tight'>{props.title}</h2>
            <form onSubmit={props.onSubmit} className='space-y-5'>
                {props.fields.map((field, idx) => (
                    <div key={field.name}>
                        <input
                            name={field.name}
                            type={field.type || 'text'}
                            placeholder={field.placeholder}
                            value={field.value}
                            onChange={field.onChange}
                            autoComplete={field.name}
                            className='w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 bg-gray-50 text-base transition placeholder-gray-400 outline-none'
                        />
                        {field.error && <div className='text-red-500 text-xs mt-1 pl-1'>{field.error}</div>}
                    </div>
                ))}
                <button
                    type='submit'
                    className='w-full py-3 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-semibold text-base shadow transition disabled:opacity-60 disabled:cursor-not-allowed'
                    disabled={props.loading}
                >
                    {props.loading ? `${props.submitLabel} 중...` : props.submitLabel}
                </button>
                {props.children}
            </form>
        </div>
    )
}
