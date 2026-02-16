'use client'

export default function UserFormRow({ left, right }) {
    return (
        <div className="row mb-3">
            <div className="col-md-6">{left}</div>
            <div className="col-md-6">{right}</div>
        </div>
    )
}