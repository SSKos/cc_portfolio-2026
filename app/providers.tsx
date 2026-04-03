'use client'

import { SessionProvider } from 'next-auth/react'
import { AnalyticsTracker } from '@/components/analytics/AnalyticsTracker'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AnalyticsTracker />
      {children}
    </SessionProvider>
  )
}
