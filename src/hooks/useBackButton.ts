import { useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const MAIN_TAB_ROUTES = ['/', '/plan', '/menu']

export function useBackButton() {
  const location = useLocation()
  const navigate = useNavigate()
  const isMainTab = MAIN_TAB_ROUTES.includes(location.pathname)

  const handleBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (!tg) return

    if (isMainTab) {
      tg.BackButton.hide()
    } else {
      tg.BackButton.show()
      tg.BackButton.onClick(handleBack)
    }

    return () => {
      if (tg.BackButton.offClick) {
        tg.BackButton.offClick(handleBack)
      }
    }
  }, [location.pathname, isMainTab, handleBack])

  return { isMainTab }
}

export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type)
  } catch {
  }
}

export function triggerHapticNotification(type: 'error' | 'success' | 'warning') {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type)
  } catch {
  }
}
