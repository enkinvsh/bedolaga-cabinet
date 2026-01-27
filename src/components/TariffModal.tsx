import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { subscriptionApi } from '../api/subscription'
import { balanceApi } from '../api/balance'
import { triggerHapticFeedback, triggerHapticNotification } from '../hooks/useBackButton'
import type { Tariff, TariffPeriod } from '../types'
import TopUpModal from './TopUpModal'

interface TariffModalProps {
  tariff: Tariff
  onClose: () => void
}

const InfinityIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.303 0-4.303 8 0 8 5.606 0 7.644-8 12.74-8z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const SunIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
)

export default function TariffModal({ tariff, onClose }: TariffModalProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [isVisible, setIsVisible] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<TariffPeriod | null>(
    tariff.periods.length > 0 ? tariff.periods[0] : null
  )
  const [showTopUp, setShowTopUp] = useState(false)
  const [missingAmount, setMissingAmount] = useState(0)

  // Check if this is a daily tariff
  const isDaily = tariff.is_daily || tariff.periods.length === 0

  const { data: balanceData } = useQuery({
    queryKey: ['user-balance'],
    queryFn: balanceApi.getBalance,
    staleTime: 30000,
  })

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: balanceApi.getPaymentMethods,
    staleTime: 300000,
  })

  const balance = balanceData?.balance_kopeks || 0

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const purchaseMutation = useMutation({
    mutationFn: ({ tariffId, periodDays }: { tariffId: number; periodDays: number }) =>
      subscriptionApi.purchaseTariff(tariffId, periodDays),
    onSuccess: () => {
      triggerHapticNotification('success')
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] })
      queryClient.invalidateQueries({ queryKey: ['user-balance'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-options'] })
      handleClose()
    },
    onError: () => {
      triggerHapticNotification('error')
    },
  })

  const handlePurchase = () => {
    if (isDaily) {
      // For daily tariff, we need at least daily price in balance
      const dailyPrice = (tariff as unknown as { daily_price_kopeks?: number }).daily_price_kopeks || 0
      if (balance < dailyPrice) {
        const missing = (dailyPrice - balance) / 100
        setMissingAmount(Math.ceil(missing))
        setShowTopUp(true)
        return
      }
      triggerHapticFeedback('medium')
      purchaseMutation.mutate({ tariffId: tariff.id, periodDays: 1 })
      return
    }

    if (!selectedPeriod) return
    triggerHapticFeedback('medium')

    if (balance < selectedPeriod.price_kopeks) {
      const missing = (selectedPeriod.price_kopeks - balance) / 100
      setMissingAmount(Math.ceil(missing))
      setShowTopUp(true)
      return
    }

    purchaseMutation.mutate({ tariffId: tariff.id, periodDays: selectedPeriod.days })
  }

  const handleTopUp = () => {
    triggerHapticFeedback('light')
    setMissingAmount(0)
    setShowTopUp(true)
  }

  const formatPrice = (kopeks: number) => {
    const rubles = kopeks / 100
    return rubles.toLocaleString(i18n.language === 'ru' ? 'ru-RU' : 'en-US') + ' ₽'
  }

  const getPeriodLabel = (period: TariffPeriod) => {
    if (period.months === 1) return t('zen.tariffModal.month1', '1 month')
    if (period.months === 3) return t('zen.tariffModal.month3', '3 months')
    if (period.months === 6) return t('zen.tariffModal.month6', '6 months')
    if (period.months === 12) return t('zen.tariffModal.month12', '12 months')
    return period.label || `${period.days} ${t('subscription.days', 'days')}`
  }

  const insufficientBalance = selectedPeriod && balance < selectedPeriod.price_kopeks
  const dailyPrice = (tariff as unknown as { daily_price_kopeks?: number }).daily_price_kopeks || 0
  const dailyInsufficientBalance = isDaily && balance < dailyPrice

  if (showTopUp && paymentMethods && paymentMethods.length > 0) {
    const defaultMethod = paymentMethods.find(m => m.is_available) || paymentMethods[0]
    return (
      <TopUpModal
        method={defaultMethod}
        onClose={() => setShowTopUp(false)}
        initialAmountRubles={missingAmount}
      />
    )
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center">
      <div 
        className={`absolute inset-0 zen-modal-backdrop transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      
      <div
        className={`w-full max-w-[430px] bg-zen-card rounded-t-[2.5rem] p-8 transform transition-transform duration-300 relative ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-zen-sub/30 rounded-full mx-auto mb-6" />

        <div className="flex items-start justify-between mb-6">
          <div>
              <h2 className="font-display text-2xl font-bold text-zen-text">{tariff.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {tariff.is_unlimited_traffic ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <InfinityIcon />
                    <span className="text-sm">{t('zen.tariff.unlimited', 'Unlimited')}</span>
                  </span>
                ) : (
                  <span className="text-zen-sub text-sm">
                    {tariff.traffic_limit_gb} GB
                  </span>
                )}
                <span className="text-zen-sub text-sm">
                  {tariff.device_limit} {t('zen.tariff.devices', 'devices')}
                </span>
              </div>
            </div>
            {tariff.tier_level >= 3 && tariff.is_unlimited_traffic && (
              <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                PRO
              </div>
            )}
          </div>

          {/* Daily Tariff Content */}
          {isDaily ? (
            <>
              <div className="mb-6 p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-amber-600 dark:text-amber-400">
                    <SunIcon />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-zen-text">{formatPrice(dailyPrice)}</p>
                    <p className="text-xs text-slate-500 dark:text-zen-sub">Стоимость в день</p>
                  </div>
                </div>
                
                <ul className="space-y-2 text-sm text-slate-600 dark:text-zen-sub">
                  <li>• Списывается ежедневно с баланса</li>
                  <li>• Можно приостановить в любой момент</li>
                </ul>
              </div>
              
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl mb-6">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  💡 Рекомендуем пополнить: 200 ₽
                </p>
                <p className="text-xs text-slate-500 dark:text-zen-sub mt-1">
                  Хватит примерно на {Math.floor(20000 / dailyPrice)} дней
                </p>
              </div>

              <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex justify-between items-center">
                  <span className="text-zen-sub text-sm">{t('zen.tariff.yourBalance', 'Your balance')}</span>
                  <span className={`font-bold ${dailyInsufficientBalance ? 'text-red-500' : 'text-zen-text'}`}>
                    {formatPrice(balance)}
                  </span>
                </div>
                {dailyInsufficientBalance && (
                  <p className="text-xs text-red-500 mt-2">
                    {t('zen.tariffModal.needMore', 'Need to top up')}: {formatPrice(dailyPrice - balance)}
                  </p>
                )}
              </div>

              {dailyInsufficientBalance ? (
                <button
                  onClick={handleTopUp}
                  className="w-full py-4 rounded-2xl font-bold text-lg transition-all btn-press bg-gradient-to-r from-emerald-400 to-teal-600 text-white shadow-glow"
                >
                  {t('zen.tariff.topUp', 'Top Up Balance')}
                </button>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={purchaseMutation.isPending}
                  className="w-full py-4 rounded-2xl font-bold text-lg transition-all btn-press bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg disabled:opacity-50"
                >
                  {purchaseMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    t('subscription.dailyPurchase.activate', 'Activate for {{price}}').replace('{{price}}', formatPrice(dailyPrice))
                  )}
                </button>
              )}
            </>
          ) : (
            /* Period Tariff Content */
            <>
              <div className="mb-6">
                <p className="text-xs font-bold text-zen-sub uppercase tracking-widest mb-3">
                  {t('zen.tariffModal.selectPeriod', 'Select Period')}
                </p>
                <div className="space-y-2">
                  {tariff.periods.map((period) => {
                    const isSelected = selectedPeriod?.days === period.days
                    return (
                      <button
                        key={period.days}
                        onClick={() => {
                          triggerHapticFeedback('light')
                          setSelectedPeriod(period)
                        }}
                        className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500'
                            : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isSelected 
                              ? 'bg-emerald-500 text-white' 
                              : 'border-2 border-slate-300 dark:border-slate-600'
                          }`}>
                            {isSelected && <CheckIcon />}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-zen-text">{getPeriodLabel(period)}</p>
                            {period.discount_percent && period.discount_percent > 0 && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                -{period.discount_percent}%
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-zen-text">{formatPrice(period.price_kopeks)}</p>
                          {period.original_price_kopeks && period.original_price_kopeks > period.price_kopeks && (
                            <p className="text-xs text-zen-sub line-through">
                              {formatPrice(period.original_price_kopeks)}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedPeriod && (
                <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex justify-between items-center">
                    <span className="text-zen-sub text-sm">{t('zen.tariff.yourBalance', 'Your balance')}</span>
                    <span className={`font-bold ${insufficientBalance ? 'text-red-500' : 'text-zen-text'}`}>
                      {formatPrice(balance)}
                    </span>
                  </div>
                  {insufficientBalance && (
                    <p className="text-xs text-red-500 mt-2">
                      {t('zen.tariffModal.needMore', 'Need to top up')}: {formatPrice(selectedPeriod.price_kopeks - balance)}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={insufficientBalance ? handleTopUp : handlePurchase}
                disabled={!selectedPeriod || purchaseMutation.isPending}
                className="w-full py-4 rounded-2xl font-bold text-lg transition-all btn-press bg-gradient-to-r from-emerald-400 to-teal-600 text-white shadow-glow disabled:opacity-50"
              >
                {purchaseMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : insufficientBalance ? (
                  t('zen.tariff.topUp', 'Top Up Balance')
                ) : (
                  <>
                    {t('zen.tariff.purchase', 'Purchase')}
                    {selectedPeriod && ` ${formatPrice(selectedPeriod.price_kopeks)}`}
                  </>
                )}
              </button>
            </>
          )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
