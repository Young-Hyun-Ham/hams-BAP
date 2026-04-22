'use client';

import { useEffect } from 'react';

import { useStore } from '@/store';

export default function AuthInit() {
  const initAuth = useStore((s: any) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return null;
}
