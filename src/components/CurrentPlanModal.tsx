import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { subscriptionApi } from '../api/subscription'
import { triggerHapticFeedback } from '../hooks/useBackButton'
import type { Subscription, TariffsPurchaseOptions } from '../types'
import ZenModal from './ui/ZenModal'
import ManagePlanModal from './ManagePlanModal'

interface CurrentPlanModalProps {
  subscription: Subscription
  onClose: () => void
}

const InfinityIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.303 0-4.303 8 0 8 5.606 0 7.644-8 12.74-8z" />
  </svg>
)

const DeviceIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
)

const ServerIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
)

export default function CurrentPlanModal({ subscription, onClose }: CurrentPlanModalProps) {
  const { t, i18n } = useTranslation()
  const [showManagePlan, setShowManagePlan] = useState(false)

  const { data: purchaseOptions } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: subscriptionApi.getPurchaseOptions,
    staleTime: 60000,
  })

  const getTariffName = () => {
    if (!subscription.tariff_id) return null
    if (purchaseOptions?.sales_mode === 'tariffs') {
      const tariffs = (purchaseOptions as TariffsPurchaseOptions).tariffs
      const tariff = tariffs.find(t => t.id === subscription.tariff_id)
      if (tariff) return tariff.name
    }
    return null
  }

  const tariffName = getTariffName()

  const formatExpiryDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US'
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const isUnlimitedTraffic = subscription.traffic_limit_gb === 0 || subscription.traffic_limit_gb === -1

  const handleManagePlan = () => {
    triggerHapticFeedback('light')
    setShowManagePlan(true)
  }

  if (showManagePlan) {
    return (
      <ManagePlanModal
        subscription={subscription}
        onClose={() => setShowManagePlan(false)}
        onPurchaseSuccess={onClose}
      />
    )
  }

  return (
    <ZenModal isOpen={true} onClose={onClose}>
      <h3 className="text-2xl font-bold text-zen-text mb-2">
        {tariffName || 'Classic'}
      </h3>
      <p className="text-sm text-zen-sub mb-6">
        {t('zen.planModal.fullDetails', 'Full plan details')}
      </p>
      
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              {isUnlimitedTraffic ? <InfinityIcon /> : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm text-zen-sub font-medium">{t('zen.planModal.traffic', 'Traffic')}</p>
              <p className="font-bold text-zen-text">
                {isUnlimitedTraffic ? t('zen.tariff.unlimited', 'Unlimited') : `${subscription.traffic_limit_gb} GB`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <DeviceIcon />
            </div>
            <div>
              <p className="text-sm text-zen-sub font-medium">{t('zen.planModal.devices', 'Devices')}</p>
              <p className="font-bold text-zen-text">{subscription.device_limit}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <CalendarIcon />
            </div>
            <div>
              <p className="text-sm text-zen-sub font-medium">{t('zen.planModal.expiresOn', 'Expires on')}</p>
              <p className="font-bold text-zen-text">{formatExpiryDate(subscription.end_date)}</p>
            </div>
          </div>
        </div>

        {subscription.servers && subscription.servers.length > 0 && (
          <div className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <ServerIcon />
              </div>
              <div className="flex-1">
                <p className="text-sm text-zen-sub font-medium mb-2">{t('zen.planModal.servers', 'Servers')}</p>
                <div className="flex flex-wrap gap-2">
                  {subscription.servers.map((server) => (
                    <span 
                      key={server.uuid}
                      className="px-3 py-1 bg-white dark:bg-slate-700 rounded-lg text-xs font-medium text-zen-text"
                    >
                      {server.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleManagePlan}
        className="w-full py-4 rounded-2xl font-bold text-lg btn-press bg-gradient-to-r from-emerald-400 to-teal-600 text-white shadow-glow flex items-center justify-center gap-2"
      >
        {t('zen.plan.managePlan', 'Manage Plan')}
        <ChevronRightIcon />
      </button>
    </ZenModal>
  )
}
