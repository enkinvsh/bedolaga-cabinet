import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { balanceApi } from '../api/balance'
import { triggerHapticFeedback, triggerHapticNotification } from '../hooks/useBackButton'
import { checkRateLimit, getRateLimitResetTime, RATE_LIMIT_KEYS } from '../utils/rateLimit'
import ZenModal from './ui/ZenModal'
import type { PaymentMethod } from '../types'

const TELEGRAM_LINK_REGEX = /^https?:\/\/t\.me\//i
const isTelegramPaymentLink = (url: string): boolean => TELEGRAM_LINK_REGEX.test(url)

const stripEmojis = (str: string): string => {
  return str
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{1F000}-\u{1F02F}]/gu, '')
    .trim()
}

const openPaymentLink = (url: string, reservedWindow?: Window | null) => {
  if (typeof window === 'undefined' || !url) return
  const webApp = window.Telegram?.WebApp

  if (isTelegramPaymentLink(url) && webApp?.openTelegramLink) {
    try { webApp.openTelegramLink(url); return } catch { }
  }
  if (webApp?.openLink) {
    try { webApp.openLink(url, { try_instant_view: false, try_browser: true }); return } catch { }
  }
  if (reservedWindow && !reservedWindow.closed) {
    try { reservedWindow.location.href = url; reservedWindow.focus?.() } catch { }
    return
  }
  const w2 = window.open(url, '_blank', 'noopener,noreferrer')
  if (w2) { w2.opener = null; return }
  window.location.href = url
}

const StarIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const CardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
)

const CryptoIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const getMethodIcon = (methodId: string) => {
  const id = methodId.toLowerCase()
  if (id.includes('stars')) return <StarIcon />
  if (id.includes('crypto') || id.includes('ton') || id.includes('usdt')) return <CryptoIcon />
  return <CardIcon />
}

const getMethodColor = (methodId: string) => {
  const id = methodId.toLowerCase()
  if (id.includes('stars')) return 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 text-yellow-500'
  if (id.includes('crypto') || id.includes('ton')) return 'bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-orange-500'
  return 'bg-zen-accent/10 text-zen-accent'
}

interface TopUpModalProps {
  method: PaymentMethod
  onClose: () => void
  initialAmountRubles?: number
}

export default function TopUpModal({ method, onClose, initialAmountRubles }: TopUpModalProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const getInitialAmount = (): string => {
    if (!initialAmountRubles || initialAmountRubles <= 0) return ''
    return Math.ceil(initialAmountRubles).toString()
  }

  const [amount, setAmount] = useState(getInitialAmount)
  const [error, setError] = useState<string | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(
    method.options && method.options.length > 0 ? method.options[0].id : null
  )
  const popupRef = useRef<Window | null>(null)
  const [isInputFocused, setIsInputFocused] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 350)
    return () => clearTimeout(timer)
  }, [])

  const hasOptions = method.options && method.options.length > 0
  const minRubles = method.min_amount_kopeks / 100
  const maxRubles = method.max_amount_kopeks / 100
  const methodKey = method.id.toLowerCase().replace(/-/g, '_')
  const isStarsMethod = methodKey.includes('stars')
  const methodName = t(`balance.paymentMethods.${methodKey}.name`, { defaultValue: '' }) || stripEmojis(method.name)
  const isTelegramMiniApp = typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp?.initData)

  const formatRubles = (n: number) => Math.round(n).toLocaleString('ru-RU')

  const starsPaymentMutation = useMutation({
    mutationFn: (amountKopeks: number) => balanceApi.createStarsInvoice(amountKopeks),
    onSuccess: (data) => {
      const webApp = window.Telegram?.WebApp
      if (!data.invoice_url) { setError(t('balance.errors.noPaymentLink', 'Server did not return payment link')); return }
      if (!webApp?.openInvoice) { setError(t('balance.errors.starsOnlyTelegram', 'Stars payment only available in Telegram')); return }
      try {
        webApp.openInvoice(data.invoice_url, (status) => {
          if (status === 'paid') { triggerHapticNotification('success'); onClose() }
          else if (status === 'failed') { setError(t('balance.errors.paymentFailed', 'Payment failed')) }
        })
      } catch (e) { setError(String(e)) }
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string } } }
      setError(axiosError?.response?.data?.detail || t('common.error'))
    },
  })

  const topUpMutation = useMutation<{
    payment_id: string; payment_url?: string; invoice_url?: string
    amount_kopeks: number; amount_rubles: number; status: string; expires_at: string | null
  }, unknown, number>({
    mutationFn: (amountKopeks: number) => balanceApi.createTopUp(amountKopeks, method.id, selectedOption || undefined),
    onSuccess: (data) => {
      const redirectUrl = data.payment_url || (data as { invoice_url?: string }).invoice_url
      if (redirectUrl) openPaymentLink(redirectUrl, popupRef.current)
      popupRef.current = null
      triggerHapticNotification('success')
      onClose()
    },
    onError: (err: unknown) => {
      try { if (popupRef.current && !popupRef.current.closed) popupRef.current.close() } catch { }
      popupRef.current = null
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || ''
      setError(detail.includes('not yet implemented') ? t('balance.useBot') : (detail || t('common.error')))
    },
  })

  const handleSubmit = () => {
    setError(null)
    inputRef.current?.blur()
    triggerHapticFeedback('light')

    if (!checkRateLimit(RATE_LIMIT_KEYS.PAYMENT, 3, 30000)) {
      setError(t('balance.errors.rateLimit', { seconds: getRateLimitResetTime(RATE_LIMIT_KEYS.PAYMENT) }))
      return
    }
    if (hasOptions && !selectedOption) { setError(t('balance.errors.selectOption', 'Select payment option')); return }
    const amountRubles = parseFloat(amount)
    if (isNaN(amountRubles) || amountRubles <= 0) { setError(t('balance.errors.enterAmount', 'Enter amount')); return }
    if (amountRubles < minRubles || amountRubles > maxRubles) {
      setError(`${t('balance.errors.amountRange', 'Amount')}: ${formatRubles(minRubles)} – ${formatRubles(maxRubles)} ₽`)
      return
    }

    const amountKopeks = Math.round(amountRubles * 100)
    if (!isTelegramMiniApp) {
      try { popupRef.current = window.open('', '_blank') } catch { popupRef.current = null }
    }
    if (isStarsMethod) { starsPaymentMutation.mutate(amountKopeks) }
    else { topUpMutation.mutate(amountKopeks) }
  }

  const quickAmounts = [100, 300, 500, 1000].filter((a) => a >= minRubles && a <= maxRubles)
  const isPending = topUpMutation.isPending || starsPaymentMutation.isPending
  const displayAmount = amount && parseFloat(amount) > 0 ? parseFloat(amount) : 0

  return (
    <ZenModal isOpen={true} onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getMethodColor(method.id)}`}>
          {getMethodIcon(method.id)}
        </div>
        <div className="flex-1">
          <h3 className="font-display text-xl font-medium text-zen-text">{methodName}</h3>
          <p className="text-sm text-zen-sub">
            {formatRubles(minRubles)} – {formatRubles(maxRubles)} ₽
          </p>
        </div>
      </div>

      {hasOptions && method.options && (
        <div className="mb-5">
          <label className="text-xs font-bold text-zen-sub uppercase tracking-widest mb-2 block">
            {t('balance.paymentMethod', 'Payment option')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {method.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { setSelectedOption(opt.id); triggerHapticFeedback('light') }}
                className={`relative py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  selectedOption === opt.id
                    ? 'bg-zen-accent/10 text-zen-accent ring-2 ring-zen-accent/30'
                    : 'bg-zen-bg text-zen-sub hover:bg-zen-sub/10 border border-zen-sub/10'
                }`}
              >
                {opt.name}
                {selectedOption === opt.id && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-zen-accent" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="text-xs font-bold text-zen-sub uppercase tracking-widest mb-2 block">
          {t('balance.enterAmount', 'Amount')}
        </label>
        <div className={`relative rounded-2xl transition-all ${
          isInputFocused
            ? 'ring-2 ring-zen-accent/50 bg-zen-bg'
            : 'bg-zen-bg border border-zen-sub/10'
        }`}>
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            enterKeyHint="done"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit() } }}
            placeholder="0"
            className="w-full h-14 px-5 pr-14 text-2xl font-bold bg-transparent text-zen-text placeholder:text-zen-sub/50 focus:outline-none"
            autoComplete="off"
          />
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-lg font-bold text-zen-sub">
            ₽
          </span>
        </div>
      </div>

      {quickAmounts.length > 0 && (
        <div className="flex gap-2 mb-5">
          {quickAmounts.map((a) => {
            const val = a.toString()
            const isSelected = amount === val
            return (
              <button
                key={a}
                type="button"
                onClick={() => { setAmount(val); triggerHapticFeedback('light'); inputRef.current?.blur() }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isSelected
                    ? 'bg-zen-accent/10 text-zen-accent ring-1 ring-zen-accent/30'
                    : 'bg-zen-bg text-zen-sub hover:bg-zen-sub/10 border border-zen-sub/10'
                }`}
              >
                {formatRubles(a)}
              </button>
            )
          })}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
          <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-500">{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || !amount || parseFloat(amount) <= 0}
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all btn-press ${
          isPending || !amount || parseFloat(amount) <= 0
            ? 'bg-zen-sub/20 text-zen-sub cursor-not-allowed'
            : isStarsMethod
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
              : 'bg-zen-text dark:bg-zen-accent text-white shadow-lg'
        }`}
      >
        {isPending ? (
          <>
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{t('common.loading')}</span>
          </>
        ) : (
          <>
            <span>{t('balance.topUp', 'Top Up')}</span>
            {displayAmount > 0 && (
              <span className="opacity-90">
                {formatRubles(displayAmount)} ₽
              </span>
            )}
          </>
        )}
      </button>
    </ZenModal>
  )
}
