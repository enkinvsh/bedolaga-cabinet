import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { subscriptionApi } from '../../api/subscription'
import { balanceApi } from '../../api/balance'
import { triggerHapticFeedback } from '../../hooks/useBackButton'
import TopUpModal from '../../components/TopUpModal'
import TariffModal from '../../components/TariffModal'
import CurrentPlanModal from '../../components/CurrentPlanModal'
import type { PaymentMethod, TariffsPurchaseOptions, Tariff } from '../../types'

const InfinityIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.303 0-4.303 8 0 8 5.606 0 7.644-8 12.74-8z" />
  </svg>
)

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


const ChevronRightIcon = () => (
  <svg className="w-4 h-4 text-zen-sub" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
)

const getMethodIcon = (methodId: string) => {
  const id = methodId.toLowerCase()
  if (id.includes('star')) return <StarIcon />
  if (id.includes('crypto') || id.includes('ton') || id.includes('usdt')) return <CryptoIcon />
  return <CardIcon />
}

const getMethodColor = (methodId: string) => {
  const id = methodId.toLowerCase()
  if (id.includes('star')) return 'bg-blue-50 dark:bg-blue-900/30 text-blue-500'
  if (id.includes('crypto') || id.includes('ton')) return 'bg-orange-50 dark:bg-orange-900/30 text-orange-500'
  return 'bg-zen-sub/10 text-zen-sub'
}

const stripEmojis = (str: string): string => {
  return str
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{1F000}-\u{1F02F}]/gu, '')
    .trim()
}



export default function PlanTab() {
  const { t, i18n } = useTranslation()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null)
  const [showTopUpForPurchase, setShowTopUpForPurchase] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: subscriptionApi.getSubscription,
    staleTime: 60000,
  })

  const { data: purchaseOptions } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: subscriptionApi.getPurchaseOptions,
    staleTime: 60000,
  })

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: balanceApi.getPaymentMethods,
    staleTime: 300000,
  })

  const formatExpiryDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US'
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const isActive = subscription?.is_active && (subscription?.status === 'active' || subscription?.status === 'trial')
  const isUnlimitedTraffic = subscription?.traffic_limit_gb === 0 || subscription?.traffic_limit_gb === -1
  const isTrial = subscription?.is_trial || subscription?.status === 'trial'
  const shouldShowTariffs = !subscription?.is_active || isTrial
  const isTariffsMode = purchaseOptions?.sales_mode === 'tariffs'
  const tariffs = isTariffsMode ? (purchaseOptions as TariffsPurchaseOptions).tariffs : []
  
  const maxTierLevel = tariffs.length > 0 ? Math.max(...tariffs.map(t => t.tier_level)) : 0
  const currentTierLevel = subscription?.tariff_id 
    ? tariffs.find(t => t.id === subscription.tariff_id)?.tier_level || 0
    : 0
  const canUpgrade = currentTierLevel < maxTierLevel

  const getConnectionName = () => {
    if (!subscription || !isActive) {
      return t('zen.plan.offline', 'Offline')
    }
    if (subscription.servers && subscription.servers.length > 0) {
      return subscription.servers[0].name
    }
    return 'VPN'
  }

  const handleExtend = () => {
    triggerHapticFeedback('light')
  }

  const handleMethodClick = (method: PaymentMethod) => {
    if (!method.is_available) return
    triggerHapticFeedback('light')
    setSelectedMethod(method)
  }

  const handleTariffClick = (tariff: Tariff) => {
    if (!tariff.is_available || tariff.is_current) return
    triggerHapticFeedback('light')
    setSelectedTariff(tariff)
  }

  const handleTopUpClose = () => {
    setSelectedMethod(null)
    setShowTopUpForPurchase(false)
    setSelectedTariff(null)
  }

  return (
    <div className="space-y-6 fade-in">
      {isActive && (
        <div 
          className="w-full rounded-3xl p-6 bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-glow relative overflow-hidden cursor-pointer btn-press"
          onClick={() => {
            triggerHapticFeedback('light')
            setShowPlanModal(true)
          }}
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                  {t('zen.plan.currentPlan', 'Current Plan')}
                </p>
                {isLoading ? (
                  <div className="h-9 w-32 bg-white/20 rounded mt-1 animate-pulse" />
                ) : (
                  <h2 className="text-3xl font-extrabold mt-1">{getConnectionName()}</h2>
                )}
                {isTrial && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                    {t('zen.plan.trial', 'Trial')}
                  </span>
                )}
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                {isUnlimitedTraffic ? (
                  <InfinityIcon />
                ) : (
                  <span className="text-sm font-bold">
                    {subscription?.traffic_limit_gb || 0} GB
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-xs opacity-70 font-medium">
                  {t('zen.plan.expiresOn', 'Expires on')}
                </p>
                {isLoading ? (
                  <div className="h-6 w-28 bg-white/20 rounded mt-0.5 animate-pulse" />
                ) : (
                  <p className="font-bold text-lg">
                    {isActive ? formatExpiryDate(subscription?.end_date) : '-'}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  to="/subscription"
                  onClick={handleExtend}
                  className="bg-white text-emerald-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm btn-press hover:bg-white/90 transition-colors"
                >
                  {t('zen.plan.extend', 'Extend')}
                </Link>
                {canUpgrade && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      triggerHapticFeedback('light')
                      setShowPlanModal(true)
                    }}
                    className="bg-white text-emerald-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm btn-press hover:bg-white/90 transition-colors"
                  >
                    {t('zen.plan.upgrade', 'Upgrade')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {shouldShowTariffs && isTariffsMode && tariffs.length > 0 && (() => {
        const sortedTariffs = [...tariffs].sort((a, b) => {
          const isProA = a.tier_level >= 3
          const isProB = b.tier_level >= 3
          if (isProA && !isProB) return -1
          if (!isProA && isProB) return 1
          return b.tier_level - a.tier_level
        }).slice(0, 3)
        
        const proTariff = sortedTariffs[0]
        const otherTariffs = sortedTariffs.slice(1, 3)
        
        return (
          <div className="space-y-3">
            {proTariff && (
              <button
                onClick={() => handleTariffClick(proTariff)}
                disabled={!proTariff.is_available || proTariff.is_current}
                className={`
                  w-full rounded-3xl p-5 aspect-[2.1/1] text-left relative overflow-hidden btn-press
                  bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-xl ring-1 ring-black/10
                  ${proTariff.is_current ? 'opacity-60' : ''}
                  ${!proTariff.is_available ? 'opacity-40' : ''}
                `}
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
                
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h3 className="text-2xl font-extrabold tracking-tight">{proTariff.name}</h3>
                    {proTariff.is_unlimited_traffic && (
                      <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                        <InfinityIcon />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-bold tracking-wide">
                      AI+
                    </div>
                  </div>
                </div>
              </button>
            )}
            
            {otherTariffs.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {otherTariffs.map((tariff, index) => {
                  const isDaily = tariff.is_daily || tariff.name.toLowerCase().includes('daily') || index === 1
                  const isBasic = index === 0
                  
                  return (
                    <button
                      key={tariff.id}
                      onClick={() => handleTariffClick(tariff)}
                      disabled={!tariff.is_available || tariff.is_current}
                      className={`
                        p-5 aspect-[2/1] rounded-2xl text-left relative overflow-hidden btn-press
                        bg-white dark:bg-zen-card shadow-xl ring-1 ring-black/5 dark:ring-white/10
                        ${tariff.is_current ? 'opacity-60' : 'hover:border-emerald-200 dark:hover:border-emerald-500/30'}
                        ${!tariff.is_available ? 'opacity-40' : ''}
                      `}
                    >
                      <div className="h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900 dark:text-zen-text">{tariff.name}</h4>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {tariff.is_unlimited_traffic ? '∞' : `${tariff.traffic_limit_gb} GB`}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-end">
                          <p className="text-xs text-slate-400 dark:text-zen-sub font-medium">
                            {isDaily ? t('zen.plan.day', 'Day') : t('zen.plan.month', 'Month')}
                          </p>
                          {isBasic && (
                            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                      </div>
                      
                      {isDaily && (tariff as unknown as { daily_price_kopeks?: number }).daily_price_kopeks && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                          <span className="text-amber-600 dark:text-amber-400 text-xs">☀</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                            {((tariff as unknown as { daily_price_kopeks?: number }).daily_price_kopeks! / 100).toLocaleString('ru-RU')} ₽/день
                          </span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {paymentMethods && paymentMethods.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-zen-sub uppercase tracking-widest pl-1 mb-3">
            {t('zen.plan.paymentMethods', 'Payment Methods')}
          </h3>
          <div className="space-y-3">
            {paymentMethods.filter(m => m.is_available).map((method) => {
              const methodKey = method.id.toLowerCase().replace(/-/g, '_')
              const translatedName = t(`balance.paymentMethods.${methodKey}.name`, { defaultValue: '' })
              const displayName = translatedName || stripEmojis(method.name)
              
              return (
                <button
                  key={method.id}
                  onClick={() => handleMethodClick(method)}
                  className="w-full zen-card zen-card-hover p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getMethodColor(method.id)}`}>
                      {getMethodIcon(method.id)}
                    </div>
                    <span className="font-medium text-zen-text">
                      {displayName}
                    </span>
                  </div>
                  <ChevronRightIcon />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {selectedMethod && !showTopUpForPurchase && (
        <TopUpModal
          method={selectedMethod}
          onClose={handleTopUpClose}
        />
      )}

      {showTopUpForPurchase && paymentMethods && paymentMethods.length > 0 && (
        <TopUpModal
          method={paymentMethods.find(m => m.is_available) || paymentMethods[0]}
          onClose={handleTopUpClose}
        />
      )}

      {selectedTariff && (
        <TariffModal
          tariff={selectedTariff}
          onClose={() => setSelectedTariff(null)}
        />
      )}

      {showPlanModal && subscription && (
        <CurrentPlanModal
          subscription={subscription}
          onClose={() => setShowPlanModal(false)}
        />
      )}
    </div>
  )
}
