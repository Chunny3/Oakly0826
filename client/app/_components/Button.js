'use client'
import styles from '@/styles/_components/button.module.css'
import clsx from 'clsx'  // 建議用這個套件幫忙組 className

export default function Button({
    children,
    type = 'button',
    variant = 'primary',  // primary, secondary...
    size = 'md',          // sm, md, lg
    ...props
}) {
    return (
        <button
            type={type}
            className={clsx(styles.btn, styles[variant], styles[size])}
            {...props}
        >
            {children}
        </button>



    )
}
