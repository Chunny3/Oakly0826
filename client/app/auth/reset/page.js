'use client'
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import styles from '@/app/auth/auth.module.css'
import UserTextInput from '@/app/_components/UserTextInput'
import Button from '@/app/_components/Button'

export default function ResetPasswordPage() {
    const params = useSearchParams()
    const router = useRouter()
    const token = params.get("token")

    const [pw, setPw] = useState("")
    const [pw2, setPw2] = useState("")
    const [msg, setMsg] = useState("")
    const [loading, setLoading] = useState(false)

    const onSubmit = async (e) => {
        e.preventDefault()
        if (pw !== pw2) {
            setMsg("兩次密碼不一致")
            return
        }
        if (pw.length < 8) {
            setMsg("密碼至少 8 碼")
            return
        }
        setLoading(true)
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password: pw }),
            })
            const data = await res.json()
            if (res.ok) {
                setMsg("重設成功，將跳轉登入頁")
                setTimeout(() => router.push('/auth/login'), 1500)
            } else {
                setMsg(data.message || "重設失敗")
            }
        } catch (err) {
            console.error(err)
            setMsg("系統錯誤，請稍後再試")
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return <p>缺少 token，請重新申請忘記密碼。</p>
    }

    return (
        <div className={styles.full}>
            <div className={styles.left} style={{ backgroundImage: `url('/img/ting/註冊登入圖.png')` }} />
            <div className={styles.right}>
                <form className={styles.form} onSubmit={onSubmit}>
                    <div className={styles.title}>RESET PASSWORD</div>
                    <UserTextInput
                        id="pw"
                        label="新密碼"
                        type="password"
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        required
                        minLength={8}
                    />
                    <UserTextInput
                        id="pw2"
                        label="確認新密碼"
                        type="password"
                        value={pw2}
                        onChange={(e) => setPw2(e.target.value)}
                        required
                        minLength={8}
                    />
                    <Button type="submit" variant="primary01" size="userlg" disabled={loading}>
                        {loading ? "送出中..." : "更新密碼"}
                    </Button>
                    {msg && <p style={{ marginTop: "1rem" }}>{msg}</p>}
                </form>
            </div>
        </div>
    )
}
