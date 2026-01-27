import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import ConnectionModal from '../../components/ConnectionModal'
import TrialActivationModal from '../../components/TrialActivationModal'
import { subscriptionApi } from '../../api/subscription'
import { wheelApi } from '../../api/wheel'
import { contestsApi } from '../../api/contests'
import { infoApi } from '../../api/info'
import { triggerHapticFeedback } from '../../hooks/useBackButton'

const PowerIcon = () => (
  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
)

const SupportIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.712 4.33a9.027 9.027 0 011.652 1.306c.51.51.944 1.064 1.306 1.652M16.712 4.33l-3.448 4.138m3.448-4.138a9.014 9.014 0 00-9.424 0M19.67 7.288l-4.138 3.448m4.138-3.448a9.014 9.014 0 010 9.424m-4.138-5.976a3.736 3.736 0 00-.88-1.388 3.737 3.737 0 00-1.388-.88m2.268 2.268a3.765 3.765 0 010 2.528m-2.268-4.796a3.765 3.765 0 00-2.528 0m4.796 4.796c-.181.506-.475.982-.88 1.388a3.736 3.736 0 01-1.388.88m2.268-2.268l4.138 3.448m0 0a9.027 9.027 0 01-1.306 1.652c-.51.51-1.064.944-1.652 1.306m0 0l-3.448-4.138m3.448 4.138a9.014 9.014 0 01-9.424 0m5.976-4.138a3.765 3.765 0 01-2.528 0m0 0a3.736 3.736 0 01-1.388-.88 3.737 3.737 0 01-.88-1.388m2.268 2.268L7.288 19.67m0 0a9.024 9.024 0 01-1.652-1.306 9.027 9.027 0 01-1.306-1.652m0 0l4.138-3.448M4.33 16.712a9.014 9.014 0 010-9.424m4.138 5.976a3.765 3.765 0 010-2.528m0 0c.181-.506.475-.982.88-1.388a3.736 3.736 0 011.388-.88m-2.268 2.268L4.33 7.288m6.406 1.18L7.288 4.33m0 0a9.024 9.024 0 00-1.652 1.306A9.025 9.025 0 004.33 7.288" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-5 h-5 text-zen-sub" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
)

export default function FlowTab() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [showTrialModal, setShowTrialModal] = useState(false)

  const { data: subscription } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: subscriptionApi.getSubscription,
    staleTime: 60000,
  })

  const { data: trialInfo } = useQuery({
    queryKey: ['trial-info'],
    queryFn: subscriptionApi.getTrialInfo,
    staleTime: 60000,
    enabled: !subscription?.is_active,
  })

  const { data: wheelConfig } = useQuery({
    queryKey: ['wheel-config'],
    queryFn: wheelApi.getConfig,
    staleTime: 300000,
    retry: false,
  })

  const { data: contestsCount } = useQuery({
    queryKey: ['contests-count'],
    queryFn: contestsApi.getCount,
    staleTime: 300000,
    retry: false,
  })

  const { data: supportConfig } = useQuery({
    queryKey: ['support-config'],
    queryFn: infoApi.getSupportConfig,
    staleTime: 300000,
  })

  const handleEnableClick = () => {
    triggerHapticFeedback('medium')
    
    if (!subscription?.is_active && trialInfo?.is_available) {
      setShowTrialModal(true)
      return
    }
    
    setShowConnectionModal(true)
  }

  const handleTrialSuccess = () => {
    setShowTrialModal(false)
    setShowConnectionModal(true)
  }

  const handleSupportClick = () => {
    triggerHapticFeedback('light')
    
    if (supportConfig?.tickets_enabled) {
      navigate('/support')
      return
    }

    if (supportConfig?.support_type === 'profile') {
      const supportUsername = supportConfig.support_username || '@support'
      const username = supportUsername.startsWith('@')
        ? supportUsername.slice(1)
        : supportUsername
      const webUrl = `https://t.me/${username}`
      
      const webApp = window.Telegram?.WebApp
      if (webApp?.openTelegramLink) {
        try {
          webApp.openTelegramLink(webUrl)
          return
        } catch { }
      }
      if (webApp?.openLink) {
        try {
          webApp.openLink(webUrl, { try_browser: true })
          return
        } catch { }
      }
      window.open(webUrl, '_blank')
      return
    }

    if (supportConfig?.support_type === 'url' && supportConfig.support_url) {
      const webApp = window.Telegram?.WebApp
      if (webApp?.openLink) {
        webApp.openLink(supportConfig.support_url, { try_browser: true })
      } else {
        window.open(supportConfig.support_url, '_blank')
      }
      return
    }

    navigate('/support')
  }

  const isActive = subscription?.is_active && (subscription?.status === 'active' || subscription?.status === 'trial')

  const formatExpiryDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US'
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  }

  const showActivities = wheelConfig?.is_enabled || (contestsCount && contestsCount.count > 0)

  return (
    <div className="flex flex-col items-center h-full fade-in">
      <div className="w-full text-center mb-8 mt-4">
        <h2 className="font-display text-3xl font-bold text-zen-text mb-2 leading-tight">
          {t('zen.hero.title')}<br/>
          <span className="text-zen-accent">{t('zen.hero.titleAccent')}</span>
        </h2>
        <p className="text-zen-sub text-sm font-medium">
          {t('zen.hero.subtitle')}
        </p>
      </div>

      <div className="relative w-full aspect-square max-w-[280px] flex items-center justify-center mb-8 flex-1">
        <div className="absolute inset-0 bg-emerald-500/5 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-10 bg-emerald-500/10 rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
        
        <button 
          onClick={handleEnableClick}
          className="relative w-48 h-48 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-glow flex flex-col items-center justify-center text-white transition-transform hover:scale-105 btn-press z-10 group"
        >
          <PowerIcon />
          <span className="font-display font-bold text-lg tracking-wide mt-3">
            {t('zen.btn_enable', 'ENABLE')}
          </span>
          <span className="text-[10px] text-white/80 mt-1 font-medium uppercase tracking-wider group-hover:text-white">
            {t('zen.tap_to_start', 'Tap to start')}
          </span>
        </button>
      </div>

      <div className="w-full grid grid-cols-2 gap-4 mb-4">
        {isActive ? (
          <div className="zen-card flex flex-col justify-between h-28">
            <div className="w-8 h-8 rounded-full bg-zen-accent/10 flex items-center justify-center text-zen-sub">
              <CalendarIcon />
            </div>
            <div>
              <p className="text-[10px] text-zen-sub font-bold uppercase mb-0.5">
                {t('zen.plan_renews', 'Plan Renews')}
              </p>
              <p className="font-bold text-lg text-zen-text">
                {formatExpiryDate(subscription?.end_date)}
              </p>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => {
              triggerHapticFeedback('light')
              navigate('/plan')
            }}
            className="zen-card zen-card-hover flex flex-col justify-between h-28 text-left group"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-zen-sub font-bold uppercase mb-0.5">
                {t('zen.no_plan', 'No active plan')}
              </p>
              <p className="font-bold text-lg text-zen-text">
                {t('zen.choose_plan', 'Choose Plan')}
              </p>
            </div>
          </button>
        )}

        <button 
          onClick={handleSupportClick}
          className="zen-card zen-card-hover flex flex-col justify-between h-28 text-left group"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <SupportIcon />
          </div>
          <div>
            <p className="text-[10px] text-zen-sub font-bold uppercase mb-0.5">
              {t('zen.need_help', 'Need Help?')}
            </p>
            <p className="font-bold text-lg text-zen-text">
              {t('nav.support')}
            </p>
          </div>
        </button>
      </div>

      {showActivities && (
        <div className="w-full space-y-3 mb-4">
          <h3 className="text-xs font-bold text-zen-sub uppercase tracking-widest pl-1">
            {t('zen.activities', 'Activities')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {wheelConfig?.is_enabled && (
              <Link 
                to="/wheel" 
                className="zen-card zen-card-hover flex items-center gap-3"
                onClick={() => triggerHapticFeedback('light')}
              >
                <span className="text-2xl">🎰</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zen-sub">{t('zen.spin_win', 'Spin & Win')}</p>
                  <p className="font-bold text-zen-text truncate">{t('wheel.title')}</p>
                </div>
                <ChevronRightIcon />
              </Link>
            )}
            {contestsCount && contestsCount.count > 0 && (
              <Link 
                to="/contests" 
                className="zen-card zen-card-hover flex items-center gap-3"
                onClick={() => triggerHapticFeedback('light')}
              >
                <span className="text-2xl">🎮</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zen-sub">{contestsCount.count} {t('zen.active', 'Active')}</p>
                  <p className="font-bold text-zen-text truncate">{t('contests.title')}</p>
                </div>
                <ChevronRightIcon />
              </Link>
            )}
          </div>
        </div>
      )}

      {showConnectionModal && (
        <ConnectionModal onClose={() => setShowConnectionModal(false)} />
      )}

      {showTrialModal && trialInfo && (
        <TrialActivationModal 
          trialInfo={trialInfo} 
          onClose={() => setShowTrialModal(false)} 
          onSuccess={handleTrialSuccess}
        />
      )}
    </div>
  )
}
