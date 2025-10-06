"use client";

import { usePathname, useRouter } from "next/navigation";
import { useContext, createContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
AuthContext.displayName = "AuthContext";
// 存 user 資料的 localStorage key
const appKey = "reactLoginToken";
const userKey = "user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [item, setItem] = useState([]);
  const router = useRouter();

  // 開站自動恢復登入狀態 --------------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(userKey);
      const token = localStorage.getItem(appKey);
      if (raw && token) {
        setUser(JSON.parse(raw)); // 從 localStorage 取出 user
      }
    } catch (err) {
      console.error("恢復登入狀態失敗:", err);
    } finally {
      setIsLoading(false); // 一定要設，否則頁面會卡 loading
    }
  }, []);

  // register------------------------------------
  const register = async (name, email, password) => {
    // 前端基本驗證（和登入一樣走 FormData，維持一致）
    // const emailOK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    // if (!name || !email || !password) {
    //   return { success: false, message: "請填寫完整資料" };
    // }
    // if (!emailOK) {
    //   return { success: false, message: "Email 格式不正確" };
    // }
    // if (password.length < 6) {
    //   return { success: false, message: "密碼至少需 6 碼" };
    // }

    const API = "http://localhost:3005/api/users";
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);

    try {
      const res = await fetch(API, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      // 後端成功：{ status: "success", message: "註冊成功" }
      if (result.status === "success") {
        return { success: true, message: result.message || "註冊成功" };
      } else {
        return {
          success: false,
          message: result.message || "註冊失敗，請稍後再試",
        };
      }
    } catch (error) {
      console.log(error);
      return { success: false, message: "伺服器錯誤，請稍後再試" };
    }
  };

  // login------------------------------------
  const login = async (email, password) => {
    console.log(`在 use-auth 中, ${email}, ${password}`);
    const API = "http://localhost:3005/api/users/login";
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const res = await fetch(API, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      console.log(result);

      if (result.status == "success") {
        const token = result.data.token;
        const user = result.data.user;
        setUser(user);
        localStorage.setItem(appKey, token);
        localStorage.setItem(userKey, JSON.stringify(user));
        console.log("成功");
        router.push("/");

        return { success: true, message: result.message };
      } else {
        console.log("失敗");
        //alert(result.message);
        return { success: false, message: result.message };
        // 接 吐司？
      }
    } catch (error) {
      console.log(error);
      return { success: false, message: "伺服器錯誤，請稍後再試" };
    }
  };

  // logout------------------------------------
  const logout = async () => {
    console.log("logout");
    const API = "http://localhost:3005/api/users/logout";
    
    try {
      await fetch(API, {
      method: "POST",
      credentials: "include",   // 🔑 讓 cookie 帶過去，後端才能清掉
    });

    // 清掉前端狀態
    setUser(null);
    localStorage.clear();

    router.push("/"); // 導回首頁
    } catch (error) {
      console.log(`logout 失敗: ${error.message}`);
      setUser(null);
      localStorage.removeItem(appKey);
      localStorage.removeItem(userKey);
      // alert(error.message);
    }
  };

  // updateUserEdit------------------------------------
  const updateUserEdit = async (id, data) => {
    const API = `http://localhost:3005/api/users/${id}/edit`;
    const token = localStorage.getItem(appKey);

    try {
      const form = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          form.append(key, value);
        }
      });
      const res = await fetch(API, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const result = await res.json();

      if (result.status === "success") {
        // 更新前端 user 狀態
        // const newUser = { ...user, ...data };
        const newUser = result.data?.user
          ? result.data.user
          : { ...user, ...data };
        setUser(newUser);
        localStorage.setItem(userKey, JSON.stringify(newUser));
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      return { success: false, message: "伺服器錯誤" };
    }
  };
  // 更新密碼
  const updateUserPassword = async (id, newPassword) => {
    const API = `http://localhost:3005/api/users/${id}/password`;
    const token = localStorage.getItem(appKey);
    try {
      const res = await fetch(API, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: new URLSearchParams({ password: newPassword }),
      });
      const result = await res.json();
      if (result.status === "success") {
        return { success: true, message: result.message || "密碼更新成功" };
      }
      return { success: false, message: result.message || "密碼更新失敗" };
    } catch {
      return { success: false, message: "伺服器錯誤" };
    }
  };

  // 更新頭像
  const updateUserAvatar = async (id, file) => {
    const API = `http://localhost:3005/api/users/${id}/avatar`;
    const token = localStorage.getItem(appKey);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch(API, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await res.json();
      if (result.status === "success") {
        // 若後端回傳最新 user 或 avatar 路徑，就同步更新前端
        const newUser = result.data?.user
          ? result.data.user
          : result.data?.avatar
          ? { ...user, avatar: result.data.avatar }
          : user;

        setUser(newUser);
        localStorage.setItem(userKey, JSON.stringify(newUser));
        return { success: true, message: result.message || "頭像更新成功" };
      }
      return { success: false, message: result.message || "頭像更新失敗" };
    } catch {
      return { success: false, message: "伺服器錯誤" };
    }
  };

  // 更新訂購人跟收件人---------------------------
  const updateUser = (newData) => {
    const savedUser = localStorage.getItem(userKey);
    const currentUser = savedUser ? JSON.parse(savedUser) : user;

    // 創建一個新的物件來避免修改原始資料
    const updateUser = { ...currentUser };

    if (newData.buyer) {
      updateUser.buyer = newData.buyer;
    } else if (
      !updateUser.buyer ||
      Object.keys(updateUser.buyer).length === 0
    ) {
      // 只有在完全沒有 buyer 資料時才創建預設值
      // 而且要檢查是否真的是空物件
      updateUser.buyer = {
        name: currentUser.name || "",
        phone: currentUser.phone || "",
        postcode: currentUser.postcode || "",
        city: currentUser.city || "",
        address: currentUser.address || "",
        email: currentUser.email || "",
      };
    }

    // 如果 newData 裡有 recipient，就更新 user.recipient
    if (newData.recipient) {
      updateUser.recipient = newData.recipient;
    }
    setUser(updateUser);
    localStorage.setItem(userKey, JSON.stringify(updateUser));
  };

  // 保護頁面------------------------------------
  // useEffect(() => {
  //     if (!isLoading && !user && protectedRoutes.includes(pathname)) {
  //         router.replace(loginRoute); // 導頁
  //     }
  // }, [isLoading, user, pathname]);

  // status------------------------------------
  useEffect(() => {
    const API = "http://localhost:3005/api/users/status";
    const token = localStorage.getItem(appKey);
    // console.log("checkToken token:", token);

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    const checkToken = async () => {
      try {
        const res = await fetch(API, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await res.json();
        if (result.status == "success") {
          const token = result.data.token; // 伺服器會回新的 30 分 token
          setUser(result.data.user);
          localStorage.setItem(appKey, token); // 覆蓋舊的 token
          setIsLoading(false);
        } else {
          //alert(result.message);
          setIsLoading(false);
          // setUser(null);
          localStorage.clear();
          // router.push('/auth/login');
          // 接 吐司？
        }
      } catch (error) {
        console.log(`解析token失敗: ${error.message}`);
        setUser(null);
        localStorage.removeItem(appKey);
        // router.push('/auth/login');
      }
    };
    checkToken();
  }, []);

  // 收藏 API ------------------------------
  const API_FAVORITES = "http://localhost:3005/api/users/favorites";

  // 取得收藏清單
  const getFavorites = async () => {
    const token = localStorage.getItem(appKey);

    try {
      const res = await fetch(API_FAVORITES, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.status === "success") {
        return { success: true, data: result.data };
      }
      return { success: false, message: result.message };
    } catch (err) {
      console.error(err);
      return { success: false, message: "伺服器錯誤" };
    }
  };

  // 加入收藏
  const addFavorite = async (productId, colorId, sizeId, colorName, quantity = 1) => {
    const token = localStorage.getItem(appKey);

    try {
      const res = await fetch(API_FAVORITES, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, colorId, sizeId, colorName, quantity  }),
      });
      return await res.json();
    } catch (err) {
      console.error(err);
      return { success: false, message: "伺服器錯誤" };
    }
  };

  // 取消收藏
  const removeFavorite = async (productId, colorId, sizeId) => {
    const token = localStorage.getItem(appKey);

    try {
      const res = await fetch(`${API_FAVORITES}/${productId}/${colorId}/${sizeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      return result;
    } catch (err) {
      console.error(err);
      return { success: false, message: "伺服器錯誤" };
    }
  };
  // 收藏數量調整
  const updateFavoriteQty = async (productId, colorId, sizeId, quantity) => {
  const token = localStorage.getItem(appKey);
  try {
    const res = await fetch(`${API_FAVORITES}/${productId}/${colorId}/${sizeId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity }),
    });
    return await res.json();
  } catch (err) {
    console.error("updateFavoriteQty error:", err);
    return { status: "error", message: "伺服器錯誤" };
  }
};


  // login with Google------------------------------------
  const loginWithGoogle = async (token, user) => {
    try {
      // 存到狀態
      setUser(user);
      // 存到 localStorage
      localStorage.setItem(appKey, token);
      localStorage.setItem(userKey, JSON.stringify(user));
      return { success: true, message: "Google 登入成功" };
    } catch (error) {
      console.error(error);
      return { success: false, message: "Google 登入失敗" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        register,
        login,
        logout,
        isLoading,
        users,
        updateUser,
        updateUserEdit,
        updateUserPassword,
        updateUserAvatar,
        getFavorites,
        addFavorite,
        removeFavorite,
        loginWithGoogle,
        updateFavoriteQty
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
