import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { subscriptionApi } from '../api/subscription'
import { balanceApi } from '../api/balance'
import { triggerHapticFeedback } from '../hooks/useBackButton'
import ZenModal from './ui/ZenModal'
import TariffModal from './TariffModal'
import TopUpModal from './TopUpModal'
import type { Subscription, Tariff, TariffsPurchaseOptions } from '../types'

interface ManagePlanModalProps {
  subscription: Subscription
  onClose: () => void
  onPurchaseSuccess?: () => void
}

const InfinityIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.303 0-4.303 8 0 8 5.606 0 7.644-8 12.74-8z" />
  </svg>
)

const SunIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

type UserType = 'legacy' | 'daily' | 'basic' | 'pro'

function getUserType(subscription: Subscription, tariffs: Tariff[]): UserType {
  if (!subscription.tariff_id) return 'legacy'
  
  const currentTariff = tariffs.find(t => t.id === subscription.tariff_id)
  if (!currentTariff) return 'legacy'
  
  if (currentTariff.is_daily) return 'daily'
  if (currentTariff.tier_level >= 3) return 'pro'
  return 'basic'
}

function getCurrentTariff(subscription: Subscription, tariffs: Tariff[]): Tariff | null {
  if (!subscription.tariff_id) return null
  return tariffs.find(t => t.id === subscription.tariff_id) || null
}

export default function ManagePlanModal({ subscription, onClose, onPurchaseSuccess }: ManagePlanModalProps) {
  const { t, i18n } = useTranslation()
  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null)
  const [showTopUp, setShowTopUp] = useState(false)

  const { data: purchaseOptions } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: subscriptionApi.getPurchaseOptions,
    staleTime: 60000,
  })

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

  const isTariffsMode = purchaseOptions?.sales_mode === 'tariffs'
  const tariffs = isTariffsMode ? (purchaseOptions as TariffsPurchaseOptions).tariffs : []
  const userType = getUserType(subscription, tariffs)
  const currentTariff = getCurrentTariff(subscription, tariffs)
  const balance = balanceData?.balance_kopeks || 0

  const sortedTariffs = [...tariffs].sort((a, b) => b.tier_level - a.tier_level)
  const upgradeTariffs = sortedTariffs.filter(t => 
    currentTariff ? t.tier_level > currentTariff.tier_level && !t.is_daily : true
  )

  const formatPrice = (kopeks: number) => {
    const rubles = kopeks / 100
    return rubles.toLocaleString(i18n.language === 'ru' ? 'ru-RU' : 'en-US') + ' ₽'
  }

  const formatExpiryDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US'
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'long' })
  }

  const handleTariffClick = (tariff: Tariff) => {
    if (!tariff.is_available) return
    triggerHapticFeedback('light')
    setSelectedTariff(tariff)
  }

  const handleTopUp = () => {
    triggerHapticFeedback('light')
    setShowTopUp(true)
  }

  const handleRenew = () => {
    if (currentTariff) {
      triggerHapticFeedback('light')
      setSelectedTariff(currentTariff)
    }
  }

  const dailyPrice = subscription.daily_price_kopeks || 0
  const daysOnBalance = dailyPrice > 0 ? Math.floor(balance / dailyPrice) : 0

  if (selectedTariff) {
    return (
      <TariffModal
        tariff={selectedTariff}
        onClose={() => setSelectedTariff(null)}
        onPurchaseSuccess={onPurchaseSuccess || onClose}
      />
    )
  }

  if (showTopUp && paymentMethods && paymentMethods.length > 0) {
    const defaultMethod = paymentMethods.find(m => m.is_available) || paymentMethods[0]
    return (
      <TopUpModal
        method={defaultMethod}
        onClose={() => setShowTopUp(false)}
      />
    )
  }

  const renderTariffCard = (tariff: Tariff, variant: 'default' | 'current' | 'upgrade' = 'default') => {
    const isCurrent = variant === 'current'
    const isUpgrade = variant === 'upgrade'
    const isDaily = tariff.is_daily
    const price = isDaily 
      ? (tariff as unknown as { daily_price_kopeks?: number }).daily_price_kopeks || 0
      : tariff.periods[0]?.price_kopeks || 0

    return (
      <button
        key={tariff.id}
        onClick={() => handleTariffClick(tariff)}
        disabled={!tariff.is_available}
        className={`
          w-full p-4 rounded-2xl text-left transition-all btn-press
          ${isCurrent 
            ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500' 
            : isUpgrade
              ? 'bg-slate-50 dark:bg-slate-800/50 ring-1 ring-emerald-400/50 dark:ring-emerald-600/50 hover:ring-emerald-500'
              : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
          }
          ${!tariff.is_available ? 'opacity-40' : ''}
        `}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {isCurrent && (
              <div className="w-6 h-6 flex-shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <CheckIcon />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-bold text-zen-text truncate">{tariff.name}</h4>
              <div className="flex items-center gap-2 text-xs text-zen-sub mt-0.5">
                {tariff.is_unlimited_traffic ? (
                  <span className="flex items-center gap-1">
                    <InfinityIcon />
                  </span>
                ) : (
                  <span>{tariff.traffic_limit_gb} GB</span>
                )}
                <span>•</span>
                <span>{tariff.device_limit} {t('zen.tariff.devices', 'devices')}</span>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-zen-text">{formatPrice(price)}</p>
            <p className="text-xs text-zen-sub">
              {isDaily ? t('zen.manage.perDay', '/day') : t('zen.manage.perMonth', '/month')}
            </p>
          </div>
        </div>
      </button>
    )
  }

  return (
    <ZenModal isOpen={true} onClose={onClose}>
      <div className="max-h-[70vh] overflow-y-auto -mx-8 px-8">
        <h2 className="font-display text-2xl font-bold text-zen-text mb-1">
          {t('zen.manage.title', 'Manage Plan')}
        </h2>
        <p className="text-sm text-zen-sub mb-6">
          {t('zen.manage.expiresOn', 'Active until')} {formatExpiryDate(subscription.end_date)}
        </p>

        {userType === 'legacy' && (
          <>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 mb-6">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                {t('zen.manage.legacyTitle', 'Choose a new plan')}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t('zen.manage.legacyDesc', 'Your subscription was created before the tariff system. Select a plan to continue after expiry.')}
              </p>
            </div>

            <div className="space-y-3">
              {sortedTariffs.map(tariff => 
                renderTariffCard(tariff, 'default')
              )}
            </div>
          </>
        )}

        {userType === 'daily' && (
          <>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <SunIcon />
                </div>
                <div>
                  <p className="text-sm font-bold text-zen-text">{t('zen.manage.balance', 'Balance')}</p>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {formatPrice(balance)} <span className="text-xs font-normal text-zen-sub">(≈{daysOnBalance} {t('zen.manage.days', 'days')})</span>
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleTopUp}
              className="w-full py-4 mb-6 rounded-2xl font-bold text-lg btn-press bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg"
            >
              {t('zen.manage.topUp', 'Top Up Balance')}
            </button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zen-sub/20" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white dark:bg-zen-card text-xs text-zen-sub font-medium">
                  {t('zen.manage.orUpgrade', 'or switch to monthly')}
                </span>
              </div>
            </div>

            <p className="text-xs text-zen-sub mb-3">
              💡 {t('zen.manage.savingsHint', 'Save up to 40% with a monthly plan')}
            </p>

            <div className="space-y-3">
              {upgradeTariffs.slice(0, 2).map(tariff => 
                renderTariffCard(tariff, 'upgrade')
              )}
            </div>
          </>
        )}

        {userType === 'basic' && currentTariff && (
          <>
            <div className="space-y-3 mb-6">
              {renderTariffCard(currentTariff, 'current')}
            </div>

            <button
              onClick={handleRenew}
              className="w-full py-4 mb-6 rounded-2xl font-bold text-lg btn-press bg-gradient-to-r from-emerald-400 to-teal-600 text-white shadow-glow"
            >
              {t('zen.manage.renew', 'Renew')} {currentTariff.name}
            </button>

            {upgradeTariffs.length > 0 && (
              <>
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zen-sub/20" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-white dark:bg-zen-card text-xs text-zen-sub font-medium">
                      {t('zen.manage.orUpgrade', 'or upgrade')}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {upgradeTariffs.map(tariff => 
                    renderTariffCard(tariff, 'upgrade')
                  )}
                </div>
              </>
            )}
          </>
        )}

        {userType === 'pro' && currentTariff && (
          <>
            <div className="space-y-3 mb-6">
              {renderTariffCard(currentTariff, 'current')}
            </div>

            <button
              onClick={handleRenew}
              className="w-full py-4 mb-4 rounded-2xl font-bold text-lg btn-press bg-gradient-to-r from-emerald-400 to-teal-600 text-white shadow-glow"
            >
              {t('zen.manage.renew', 'Renew')} {currentTariff.name}
            </button>

            <p className="text-center text-sm text-zen-sub">
              ✨ {t('zen.manage.bestPlan', "You're on our best plan")}
            </p>
          </>
        )}
      </div>
    </ZenModal>
  )
}
