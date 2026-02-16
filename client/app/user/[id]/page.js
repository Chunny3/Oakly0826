'use client'

// import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function UserDetailPage(props) {
    const {id} = useParams();
  return (
    <>
      <h1>會員管理中心</h1>
      <link className="btn btn-primary" href="/"></link>
    </>
  )
}
