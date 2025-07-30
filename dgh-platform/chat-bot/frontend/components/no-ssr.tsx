"use client"

import dynamic from "next/dynamic"
import { ReactNode } from "react"

interface NoSSRProps {
  children: ReactNode
  fallback?: ReactNode
}

function NoSSRComponent({ children, fallback = <div>Loading...</div> }: NoSSRProps) {
  return <>{children}</>
}

export const NoSSR = dynamic(() => Promise.resolve(NoSSRComponent), {
  ssr: false,
  loading: () => <div>Loading...</div>
})