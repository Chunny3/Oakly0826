'use client'

export default function UserSelect({
    id, label, value, onChange, required,
    options = [], placeholder = '請選擇', error,
}) {
    return (
        <div className="mb-3">
            <label className="form-label" htmlFor={id}>
                {label}{required && ' *'}
            </label>
            <select
                id={id}
                className={`form-select ${error ? 'is-invalid' : ''}`}
                value={value}
                onChange={onChange}
                required={required}
            >
                <option value="" disabled>{placeholder}</option>
                {options.map(opt => (
                    <option key={opt.value ?? opt} value={opt.value ?? opt}>
                        {opt.label ?? opt}
                    </option>
                ))}
            </select>
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    )
}
