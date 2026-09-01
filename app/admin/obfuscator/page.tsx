'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Obfuscator from '@/components/admin/Obfuscator';

export default function AdminObfuscatorPage() {
  const router = useRouter();
  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      router.replace('/admin');
    }
  }, [router]);

  return <Obfuscator />;
}
