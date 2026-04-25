'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) return null;

  return <Footer />;
}
