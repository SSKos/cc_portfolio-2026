'use client'

import { Suspense } from 'react'
import { SessionProvider } from 'next-auth/react'
import { AnalyticsTracker } from '@/components/analytics/AnalyticsTracker'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {process.env.NODE_ENV === 'production' && (
        <Suspense>
          <AnalyticsTracker />
        </Suspense>
      )}
      {children}
    </SessionProvider>
  )
}
