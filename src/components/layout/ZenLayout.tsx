import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useBackButton } from '../../hooks/useBackButton'
import { useTheme } from '../../hooks/useTheme'
import ZenBottomNav from '../zen/ZenBottomNav'
import LanguageSwitcher from '../LanguageSwitcher'

interface ZenLayoutProps {
  children: React.ReactNode
}

export default function ZenLayout({ children }: ZenLayoutProps) {
  useBackButton()
  useTheme()
  const { t } = useTranslation()

  const { data: subscription } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: async () => {
      const { subscriptionApi } = await import('../../api/subscription')
      return subscriptionApi.getSubscription()
    },
    staleTime: 60000,
  })

  const isActive = subscription?.is_active && (subscription?.status === 'active' || subscription?.status === 'trial')
  const isTrial = subscription?.is_trial || subscription?.status === 'trial'
  const isTrialExpired = subscription?.is_trial && !subscription?.is_active
  
  const getStatusInfo = () => {
    if (isTrialExpired) {
      return { label: t('zen.status.trialExpired', 'TRIAL EXPIRED'), isOnline: false, isTrial: true }
    }
    if (isTrial && isActive) {
      return { label: t('zen.status.trial', 'TRIAL'), isOnline: true, isTrial: true }
    }
    if (!subscription || !isActive) {
      return { label: t('zen.status.free', 'FREE'), isOnline: false, isTrial: false }
    }
    const tariffName = subscription.tariff_name || 'PRO ACCESS'
    return { label: tariffName, isOnline: true, isTrial: false }
  }
  
  const statusInfo = getStatusInfo()

  return (
    <div id="zen-wrapper" className="max-w-[430px] mx-auto min-h-screen relative bg-zen-bg flex flex-col" style={{ boxShadow: '0 0 50px rgba(0,0,0,0.05)' }}>
      
      <header 
        className="px-4 pb-4 flex items-center flex-shrink-0 relative zen-header-safe"
      >
        <div className="flex items-center">
          <LanguageSwitcher />
        </div>
        
        <h1 className="font-display text-xl font-bold text-zen-text tracking-tight absolute left-1/2 -translate-x-1/2">
          {import.meta.env.VITE_APP_NAME || 'Zeny'}
        </h1>
        
        <div className="ml-auto flex items-center">
          <div className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-2 border z-10 font-[Manrope] ${
            statusInfo.isTrial
              ? statusInfo.isOnline
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'bg-red-500/10 text-red-500 border-red-500/20'
              : statusInfo.isOnline 
                ? 'bg-zen-accent/10 text-zen-accent border-zen-accent/20' 
                : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              statusInfo.isTrial
                ? statusInfo.isOnline ? 'bg-amber-500' : 'bg-red-500'
                : statusInfo.isOnline ? 'bg-zen-accent' : 'bg-slate-500'
            } animate-pulse`} />
            {statusInfo.label}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-2 relative">
        <div className="fade-in">
          {children}
        </div>
      </div>

      <ZenBottomNav />
    </div>
  )
}
