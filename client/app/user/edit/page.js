'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import Edit from '@/app/_components/user/edit'
// import Link from 'next/link'


export default function UserEditPage(props) {
  const {user, isLoading} = useAuth();
  const router = useRouter();

  useEffect(()=>{
    if(!isLoading && !user){
      router.replace("/auth/login");  // 導頁
    }

  },[user, isLoading]);

  //  當 Loading / 沒有使用者 的時候，沒有畫面
  if(isLoading || !user ) return null;


  return (
    <div>
      <Edit />
    </div>
  )
}
