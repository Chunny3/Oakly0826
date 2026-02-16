"use client";

import "@/styles/cart/button.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function GreenButton({ step, to, type, onClick }) {
  const router = useRouter();
  const { user } = useAuth();

  const goTo = () => {
    if (onClick) {
      onClick(); // 如果有傳 onClick，就執行函式
      return;
    }
    if (type === "order") {
      if (user) {
        router.push(`${to}`);
        router.refresh();
      } else {
        router.push("/user/login")
      }
    } else {
      router.push(`${to}`);
    }
  }
  return (
    <button onClick={goTo} className="green-button">
      <h6>{step}</h6>
    </button>
  );
}
