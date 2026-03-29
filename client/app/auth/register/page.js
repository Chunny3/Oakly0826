'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import styles from '../auth.module.css'
// 共用元件
import UserTextInput from '@/app/_components/UserTextInput'
import Button from '@/app/_components/Button'
import GoogleLoginButton from '@/app/_components/user/GoogleLoginButton'



export default function RegisterPage() {
    const router = useRouter()
    const { register, loginWithGoogle } = useAuth()  // ✅ 從 useAuth hook 取得 register 函數

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setpassword] = useState('')
    const [password2, setpassword2] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    // ✅ debug 用
    console.log("目前表單狀態：", { name, email, password, password2 });
    const onSubmit = async (e) => {
        e.preventDefault()
        // 簡單前端驗證（和 use-auth 裡保持一致）
        if (!name || !email || !password || !password2) {
            setError('請填寫所有欄位')
            return
        }
        if (password !== password2) {
            setError('兩次密碼不一致')
            return
        }
        setError(null)
        setLoading(true)
        // ✅ 把 password2 一起傳進去
        const result = await register(name, email.trim(), password, password2)

        setLoading(false)
        if (result.success) {
            // ✅ 不用 alert，成功提示交給 use-auth.js 的 toast.success
            router.push('/auth/login')
        } else {
            // ✅ 失敗提示也交給 use-auth.js 的 toast.error，這裡保留字串供表單顯示
            setError(result.message || '註冊失敗，請稍後再試')
        }
    }

    return (
        <div className={styles.full}>
            <div className={styles.left} style={{ backgroundImage: `url('/img/ting/註冊登入圖.png')` }} />
            <div className={styles.right}>
                <form className={styles.form} onSubmit={onSubmit}>
                    <div className={styles.title}>REGISTER</div>

                    {error && <div className="text-danger mb-3">{error}</div>}

                    <UserTextInput
                        id="name" label="使用者名稱"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(null) }}
                        required 
                    />

                    <UserTextInput id="email" label="電子郵件" type="email"
                        value={email} onChange={(e) => { setEmail(e.target.value); setError(null) }} required autoComplete="email" />

                    <UserTextInput id="password" label="密碼" type="password"
                        value={password}  onChange={(e) => { setpassword(e.target.value); setError(null) }} required autoComplete="new-password" />

                    <UserTextInput id="password2" label="確認密碼" type="password"
                        value={password2} onChange={(e) => { setpassword2(e.target.value); setError(null) }}
                        error={error} required autoComplete="new-password" />

                    {/* <button className={styles.btnPrimary} type="submit">註冊</button> */}
                    <Button type="submit" variant="primary01" size="userlg" disabled={loading} >{loading ? '送出中…' : '註冊'}</Button>

                    <div className={styles.divider}><span>or</span></div>

                    <GoogleLoginButton
                        onSuccess={({ token, user }) => {
                            loginWithGoogle(token, user)   // ✅ 呼叫 use-auth.js 新增的函式
                            router.push("/")    // ✅ 成功後導頁
                        }}
                    />

                    <div className="mt-3" style={{ color: '#919191' }}>
                        已經有帳號了？<Link href="/auth/login" style={{ color: '#5b887b' }}>登入會員</Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
