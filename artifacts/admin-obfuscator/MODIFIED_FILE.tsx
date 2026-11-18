'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Obfuscator from '@/components/admin/Obfuscator';

export default function AdminObfuscatorPage() {
  const router = useRouter();
  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      router.replace('/admin');
    }
  }, [router]);

  return (
    <>
      <div className="fixed top-5 left-5 z-50">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-xs font-semibold text-white/75 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to admin
        </Link>
      </div>
      <Obfuscator />
    </>
  );
}
