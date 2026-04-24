import React from 'react'
import { Toaster } from 'sonner'

export function ToastProvider(): React.JSX.Element {
  return <Toaster position="bottom-right" richColors visibleToasts={3} />
}
