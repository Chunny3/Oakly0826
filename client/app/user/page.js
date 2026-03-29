'use client'

import { useState, useEffect } from 'react'

import Login from "@/app/_components/user/login"
import Edit from '@/app/_components/user/edit'

import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'


export default function UserPage(props) {
  const {user, isLoading} = useAuth();

  if (isLoading){
    return (
    <div> 
    {/* Loading... */}
    </div>
  )
  } 

  return (
    <div>
      <h1>會員主頁</h1>
      
      {user ?  <Edit /> : <Login /> }
      <Link className='btn btn-primary me-1 mb-1' href="/auth/login"> 登入</Link>
      <Link className='btn btn-primary me-1 mb-1' href="/register">註冊(C)</Link>
      <Link className='btn btn-primary me-1 mb-1' href="/user"> 使用者列表頁(R)</Link>
      <Link className='btn btn-primary  me-1 mb-1' href="/user/ben">使用者的主頁(R)</Link>
      <Link className='btn btn-primary  me-1 mb-1' href="/user/edit"> 修改個人資料(U)</Link>
    </div>
  )
}
