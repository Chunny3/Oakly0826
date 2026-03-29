'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/app/auth/auth.module.css'
import UserTextInput from '@/app/_components/UserTextInput'
import Button from '@/app/_components/Button'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [sent, setSent] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const onSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })
            // 無論成功或失敗，後端都會回固定訊息
            await res.json()
            setSent(true)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.full}>
            {/* 左邊圖不變 */}
            <div className={styles.left} style={{ backgroundImage: `url('/img/ting/註冊登入圖.png')` }} />
            <div className={styles.right}>
                {!sent ? (
                    <form className={styles.form} onSubmit={onSubmit}>
                        <div className={styles.title}>FORGOT PASSWORD</div>
                        <UserTextInput
                            id="email"
                            label="電子郵件"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Button type="submit" variant="primary01" size="userlg" disabled={loading}>
                            {loading ? "寄送中..." : "寄送重設連結"}
                        </Button>
                        <div className={styles.links}>
                            <a onClick={() => router.push('/auth/login')}>返回登入</a>
                        </div>
                    </form>
                ) : (
                    <div className={styles.form}>
                        <div className={styles.title}>已寄送</div>
                        <p>如果此 Email 有註冊，我們已寄出重設連結，請查收信箱。</p>
                        <div className={styles.links}>
                            <a onClick={() => router.push('/auth/login')}>返回登入</a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
