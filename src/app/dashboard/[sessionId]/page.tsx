import React from 'react'
import Dashboard from '../../../pages/Dashboard'

interface DynamicDashboardPageProps {
  params: Promise<{
    sessionId: string
  }>
}

/**
 * Dynamic Dashboard route page
 * Accessible at /dashboard/[sessionId]
 * Displays session-specific dashboard with live session data
 */
export default async function DynamicDashboardPage({ params }: DynamicDashboardPageProps) {
  const { sessionId } = await params
  return (
    <Dashboard sessionId={sessionId} />
  )
} 