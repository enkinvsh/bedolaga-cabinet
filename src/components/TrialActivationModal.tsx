import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionApi } from '../api/subscription'
import { triggerHapticFeedback, triggerHapticNotification } from '../hooks/useBackButton'
import ZenModal from './ui/ZenModal'
import type { TrialInfo } from '../types'

interface TrialActivationModalProps {
  trialInfo: TrialInfo
  onClose: () => void
  onSuccess: () => void
}

const BoltIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
)

export default function TrialActivationModal({ trialInfo, onClose, onSuccess }: TrialActivationModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const activateMutation = useMutation({
    mutationFn: subscriptionApi.activateTrial,
    onSuccess: () => {
      triggerHapticNotification('success')
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] })
      queryClient.invalidateQueries({ queryKey: ['trial-info'] })
      onSuccess()
    },
    onError: () => {
      triggerHapticNotification('error')
    },
  })

  const handleActivate = () => {
    triggerHapticFeedback('medium')
    activateMutation.mutate()
  }

  const isUnlimited = trialInfo.traffic_limit_gb === 0 || trialInfo.traffic_limit_gb === -1

  const trafficLabel = isUnlimited 
    ? t('zen.tariff.unlimited', 'Unlimited') 
    : `${trialInfo.traffic_limit_gb} GB`

  const devicesLabel = trialInfo.device_limit === 1
    ? `1 ${t('zen.trial.device', 'device')}`
    : `${trialInfo.device_limit} ${t('zen.trial.devicesShort', 'devices')}`

  return (
    <ZenModal isOpen={true} onClose={onClose}>
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
          <BoltIcon />
        </div>
        
        <h2 className="font-display text-2xl font-bold text-zen-text mb-2">
          {t('zen.trial.title', 'Try Premium Free')}
        </h2>
        
        <p className="text-zen-sub text-sm mb-8">
          <span className="text-zen-text font-semibold">{trialInfo.duration_days} {t('zen.trial.days', 'days')}</span>
          <span className="mx-2 opacity-40">•</span>
          <span>{trafficLabel}</span>
          <span className="mx-2 opacity-40">•</span>
          <span>{devicesLabel}</span>
        </p>

        <button
          onClick={handleActivate}
          disabled={activateMutation.isPending}
          className="w-full py-4 rounded-2xl font-bold text-lg transition-all btn-press bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg disabled:opacity-70"
        >
          {activateMutation.isPending ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            t('zen.trial.activate', 'Start Free Trial')
          )}
        </button>

        <p className="text-zen-sub text-xs mt-4">
          {t('zen.trial.noPayment', 'No payment required')}
        </p>

        {activateMutation.isError && (
          <p className="text-red-500 text-sm mt-4">
            {t('zen.trial.error', 'Failed to activate. Please try again.')}
          </p>
        )}
      </div>
    </ZenModal>
  )
}
