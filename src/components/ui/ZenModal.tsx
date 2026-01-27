import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ZenModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  showHandle?: boolean
}

export default function ZenModal({ isOpen, onClose, children, showHandle = true }: ZenModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center">
      {/* Backdrop - separate layer for iOS blur compatibility */}
      <div 
        className={`absolute inset-0 bg-slate-900/20 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          WebkitBackdropFilter: 'blur(4px)',
          backdropFilter: 'blur(4px)',
          willChange: 'opacity'
        }}
        onClick={handleClose}
      />
      
      {/* Modal panel - isolated from backdrop to prevent iOS blur issues */}
      <div
        className={`w-full max-w-[430px] bg-white/95 dark:bg-zen-card rounded-t-[2.5rem] p-8 transition-transform duration-300 relative ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ 
          WebkitBackdropFilter: 'blur(12px)',
          backdropFilter: 'blur(12px)',
          willChange: 'transform'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {showHandle && (
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-zen-sub/30 rounded-full mx-auto mb-6" />
        )}
        
        {children}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
