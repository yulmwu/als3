import { useState } from 'react'

export const useForm = <T extends Record<string, any>>(initialValues: T) => {
    const [values, setValues] = useState<T>(initialValues)
    const [errors, setErrors] = useState<Partial<T>>({})

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setValues((prev) => ({ ...prev, [name]: value }))
        setErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    const setFieldError = (field: keyof T, error: string) => {
        setErrors((prev) => ({ ...prev, [field]: error }))
    }

    const reset = () => {
        setValues(initialValues)
        setErrors({})
    }

    return { values, errors, handleChange, setFieldError, reset, setValues }
}
