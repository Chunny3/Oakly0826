'use client'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'
import { useRouter } from 'next/navigation'  // ✅ 新增這行
import Link from 'next/link'
import styles from '@/app/auth/auth.module.css'
import UserTextInput from '@/app/_components/UserTextInput'
import Button from '@/app/_components/Button'
import GoogleLoginButton from './GoogleLoginButton'


export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")   // ✅ 錯誤訊息

    const { login } = useAuth()
    const router = useRouter()  // ✅ 宣告 router
    const { loginWithGoogle } = useAuth()

    const onSubmit = async (e) => {
        e.preventDefault()
        const result = await login(email, password)

        if (result.success) {
            alert("登入成功")
            router.push('/');   // ✅ 只在成功時才跳首頁
            // router.refresh();
            // window.location.reload();

        } else {
            alert(result.message || "登入失敗，請再試一次")
            // ❌ 不跳轉
        }
    }

    return (
        <div className={styles.full}>
            <div className={styles.left} style={{ backgroundImage: `url('/img/ting/註冊登入圖.png')` }} />
            <div className={styles.right}>
                <form className={styles.form} onSubmit={onSubmit}>
                    <div className={styles.title}>LOGIN</div>
                    {/* ✅ 登入失敗訊息 */}
                    {error && <div className="text-danger mb-3">{error}</div>}

                    <UserTextInput
                        id="email"
                        label="電子郵件"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />

                    <UserTextInput
                        id="pw"
                        label="密碼"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />

                    <Button type="submit" variant="primary01" size="userlg">登入</Button>

                    <div className={styles.divider}><span>or</span></div>
                    
                    <GoogleLoginButton
                        onSuccess={({ token, user }) => {
                            loginWithGoogle(token, user)   // ✅ 呼叫 use-auth.js 新增的函式
                            router.push("/")    // ✅ 成功後導頁
                        }}
                    />
                    
                    <div className={styles.links}>
                        <Link href="/auth/forgotpassword">忘記密碼</Link>
                        <Link href="/auth/register">加入會員</Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
