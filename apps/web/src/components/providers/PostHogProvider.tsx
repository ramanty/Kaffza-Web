'use client'
import posthog from 'posthog-js'
import { PostHogProvider as Provider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init('phc_dummy_key_replace_later', {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageview: false // Disable automatic pageview capture, as we capture manually
    })
  }, [])

  return <Provider client={posthog}>{children}</Provider>
}
