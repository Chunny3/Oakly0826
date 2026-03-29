"use client";

import "@/styles/cart/button.css";
import { useRouter } from "next/navigation";

export default function WhiteButton({ step, to }) {
  const router = useRouter();
  const goTo = () => {
    router.push(`${to}`);
  }
  return (
    <button onClick={goTo} className="white-button">
      <h6>{step}</h6>
    </button>
  );
}
