"use client"

import React, { useState } from 'react'
import Dashboard from "../pages/Dashboard"
import LiveSession from "../pages/LiveSession"

/**
 * Home page component
 * Navigation interface for the AI live digital human live stream workshop application
 * Allows switching between Dashboard and LiveSession pages
 */
export default function Home() {
  // const [currentPage, setCurrentPage] = useState<'dashboard' | 'livesession'>('dashboard')

  return (
    <div>
      
      <LiveSession/>
    </div>
  )
}
