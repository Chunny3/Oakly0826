'use client';

import { usePathname } from 'next/navigation';
import Header from '@/app/_components/header';

export default function RootHeader() {
    const pathname = usePathname();

    // 在 /auth/* 底下完全不渲染 Header（避免重複）
    if (pathname?.startsWith('/auth')) return null;

    return <Header />;
}
