import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
// 只初始化一次（Next 熱更新或多處 import 都安全）
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// 封裝：彈窗登入 -> 取得 Firebase ID Token
export async function signInWithGooglePopup() {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken(); // ← 最重要：拿到 Firebase ID Token
    return { idToken, user: result.user };
}

// 如果其他地方要用到 app 也可以順手匯出
export { app }