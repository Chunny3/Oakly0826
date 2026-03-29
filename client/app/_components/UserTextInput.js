'use client'
import { useState } from 'react'
import { LuEye, LuEyeClosed } from "react-icons/lu"

export default function UserTextInput({
    id, label, type = 'text',
    value, onChange, required,
    hint, error,
    ...rest
}) {
    const isPassword = type === 'password'
    const [visible, setVisible] = useState(false)
    const actualType = isPassword ? (visible ? 'text' : 'password') : type

    return (
        <div className="mb-3 position-relative">
            <label className="form-label" htmlFor={id}>
                {label}{required && ' *'}
            </label>
            <input
                id={id}
                type={actualType}
                className={`form-control ${error ? 'is-invalid' : ''}`}
                value={value}
                onChange={onChange}
                required={required}
                {...rest}
                style={{ paddingRight: isPassword ? '40px' : undefined }}
            />
            {isPassword && (
                    <button
                        type="button"
                        onClick={() => setVisible(v => !v)}
                        className="btn position-absolute top-50 end-0 p-0 me-3"
                        style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#6c757d',
                            lineHeight: 0,
                            fontSize: '20px'
                        }}
                        aria-label={visible ? '隱藏密碼' : '顯示密碼'}
                        aria-pressed={visible}
                    >
                        {visible ? <LuEye /> : <LuEyeClosed />}
                    </button>
                )}
            {hint && !error && <div className="form-text">{hint}</div>}
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
        
    )
}

