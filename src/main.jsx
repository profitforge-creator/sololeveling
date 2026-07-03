import React from 'react'
import ReactDOM from 'react-dom/client'
import SystemInterface from './SystemInterface'
import PwaShell from './PwaShell'

ReactDOM.createRoot(document.getElementById('root')).render(
  <PwaShell><SystemInterface /></PwaShell>
)
