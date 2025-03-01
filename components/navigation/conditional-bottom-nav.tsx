"use client";

import { usePathname } from 'next/navigation';
import { BottomNav } from './bottom-nav';

export function ConditionalBottomNav() {
  const pathname = usePathname();
  const shouldShowNav = !['/', '/auth'].includes(pathname);

  return shouldShowNav ? <BottomNav /> : null;
}