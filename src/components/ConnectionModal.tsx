import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { subscriptionApi } from '../api/subscription'
import { triggerHapticFeedback } from '../hooks/useBackButton'
import ZenModal from './ui/ZenModal'
import type { AppInfo, AppConfig } from '../types'

interface ConnectionModalProps {
  onClose: () => void
}

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)

const MagicIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
)

const CopyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const HappIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 50 50" fill="currentColor">
    <path d="M22.3264 3H12.3611L9.44444 20.1525L21.3542 8.22034L22.3264 3Z"/>
    <path d="M10.9028 20.1525L22.8125 8.22034L20.8681 21.1469H28.4028L27.9167 21.6441L20.8681 28.8531H19.4097V30.5932L7.5 42.5254L10.9028 20.1525Z"/>
    <path d="M41.0417 8.22034L28.8889 20.1525L31.684 3H41.7708L41.0417 8.22034Z"/>
    <path d="M30.3472 20.1525L42.5 8.22034L38.6111 30.3446L26.9444 42.5254L29.0104 28.8531H22.3264L29.6181 21.1469H30.3472V20.1525Z"/>
    <path d="M40.0694 30.3446L28.4028 42.5254L27.9167 47H37.8819L40.0694 30.3446Z"/>
    <path d="M18.6806 47H8.47222L8.95833 42.5254L20.8681 30.5932L18.6806 47Z"/>
  </svg>
)

const ClashMetaIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 50 50" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M4.99239 5.21742C4.0328 5.32232 3.19446 5.43999 3.12928 5.47886C2.94374 5.58955 2.96432 33.4961 3.14997 33.6449C3.2266 33.7062 4.44146 34.002 5.84976 34.3022C7.94234 34.7483 8.60505 34.8481 9.47521 34.8481C10.3607 34.8481 10.5706 34.8154 10.7219 34.6541C10.8859 34.479 10.9066 33.7222 10.9338 26.9143L10.9638 19.3685L11.2759 19.1094C11.6656 18.7859 12.1188 18.7789 12.5285 19.0899C12.702 19.2216 14.319 20.624 16.1219 22.2061C17.9247 23.7883 19.5136 25.1104 19.6527 25.144C19.7919 25.1777 20.3714 25.105 20.9406 24.9825C22.6144 24.6221 23.3346 24.5424 24.9233 24.5421C26.4082 24.5417 27.8618 24.71 29.2219 25.0398C29.6074 25.1333 30.0523 25.1784 30.2107 25.1399C30.369 25.1016 31.1086 24.5336 31.8543 23.8777C33.3462 22.5653 33.6461 22.3017 35.4359 20.7293C36.1082 20.1388 36.6831 19.6313 36.7137 19.6017C37.5681 18.7742 38.0857 18.6551 38.6132 19.1642L38.9383 19.478V34.5138L39.1856 34.6809C39.6343 34.9843 41.2534 34.9022 43.195 34.4775C44.1268 34.2737 45.2896 34.0291 45.779 33.9339C46.2927 33.8341 46.7276 33.687 46.8079 33.5861C47.0172 33.3228 47.0109 5.87708 46.8014 5.6005C46.6822 5.4431 46.2851 5.37063 44.605 5.1996C43.477 5.08482 42.2972 5.00505 41.983 5.02223L41.4121 5.05368L35.4898 10.261C27.3144 17.4495 27.7989 17.0418 27.5372 16.9533C27.4148 16.912 26.1045 16.8746 24.6253 16.8702C22.0674 16.8626 21.9233 16.8513 21.6777 16.6396C21.0693 16.115 17.2912 12.8028 14.5726 10.4108C12.9548 8.98729 10.9055 7.18761 10.0186 6.41134L8.40584 5L7.5715 5.01331C7.11256 5.02072 5.95198 5.11252 4.99239 5.21742Z"/>
  </svg>
)

const ShadowrocketIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.2394 36.832L16.5386 39.568C16.5386 39.568 13.7182 36.832 11.8379 33.184C9.95756 29.536 16.5386 23.152 16.5386 23.152M21.2394 36.832H28.7606M21.2394 36.832C21.2394 36.832 15.5985 24.064 17.4788 16.768C19.3591 9.472 25 4 25 4C25 4 30.6409 9.472 32.5212 16.768C34.4015 24.064 28.7606 36.832 28.7606 36.832M28.7606 36.832L33.4614 39.568C33.4614 39.568 36.2818 36.832 38.1621 33.184C40.0424 29.536 33.4614 23.152 33.4614 23.152M25 46L26.8803 40.528H23.1197L25 46ZM25.9402 17.68C26.4594 18.1837 26.4594 19.0003 25.9402 19.504C25.4209 20.0077 24.5791 20.0077 24.0598 19.504C23.5406 19.0003 23.5406 18.1837 24.0598 17.68C24.5791 17.1763 25.4209 17.1763 25.9402 17.68Z"/>
  </svg>
)

const getAppIcon = (appName: string): React.ReactNode => {
  const name = appName.toLowerCase()
  if (name.includes('happ')) return <HappIcon />
  if (name.includes('shadowrocket') || name.includes('rocket')) return <ShadowrocketIcon />
  if (name.includes('clash') || name.includes('meta') || name.includes('verge')) return <ClashMetaIcon />
  return <span className="text-lg">📦</span>
}

const platformOrder = ['ios', 'android', 'windows', 'macos', 'linux', 'androidTV', 'appleTV']
const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:']

function isValidExternalUrl(url: string | undefined): boolean {
  if (!url) return false
  const lowerUrl = url.toLowerCase().trim()
  if (dangerousSchemes.some(scheme => lowerUrl.startsWith(scheme))) return false
  return lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')
}

function isValidDeepLink(url: string | undefined): boolean {
  if (!url) return false
  const lowerUrl = url.toLowerCase().trim()
  if (dangerousSchemes.some(scheme => lowerUrl.startsWith(scheme))) return false
  return lowerUrl.includes('://')
}

function detectPlatform(): string | null {
  if (typeof window === 'undefined' || !navigator?.userAgent) return null
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return /tv|television/.test(ua) ? 'androidTV' : 'android'
  if (/macintosh|mac os x/.test(ua)) return 'macos'
  if (/windows/.test(ua)) return 'windows'
  if (/linux/.test(ua)) return 'linux'
  return null
}

const platformNames: Record<string, string> = {
  ios: 'iOS / iPadOS',
  android: 'Android',
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  androidTV: 'Android TV',
  appleTV: 'Apple TV'
}

const platformColors: Record<string, string> = {
  ios: 'bg-slate-900 dark:bg-slate-800',
  android: 'bg-emerald-500',
  windows: 'bg-blue-500',
  macos: 'bg-slate-700',
  linux: 'bg-orange-500',
  androidTV: 'bg-emerald-600',
  appleTV: 'bg-slate-800'
}

export default function ConnectionModal({ onClose }: ConnectionModalProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: appConfig, isLoading, error } = useQuery<AppConfig>({
    queryKey: ['appConfig'],
    queryFn: () => subscriptionApi.getAppConfig(),
  })

  const detectedPlatform = useMemo(() => detectPlatform(), [])

  useEffect(() => {
    if (!appConfig?.platforms || selectedApp) return
    
    let platform = detectedPlatform
    if (!platform || !appConfig.platforms[platform]?.length) {
      platform = platformOrder.find(p => appConfig.platforms[p]?.length > 0) || null
    }
    
    if (!platform || !appConfig.platforms[platform]?.length) return
    
    const apps = appConfig.platforms[platform]
    const app = apps.find(a => a.isFeatured) || apps[0]
    if (app) setSelectedApp(app)
  }, [appConfig, detectedPlatform, selectedApp])

  const copySubscriptionLink = async () => {
    if (!appConfig?.subscriptionUrl) return
    triggerHapticFeedback('light')
    try {
      await navigator.clipboard.writeText(appConfig.subscriptionUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = appConfig.subscriptionUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleConnect = (app: AppInfo) => {
    if (!app.deepLink || !isValidDeepLink(app.deepLink)) return
    triggerHapticFeedback('medium')
    const lang = i18n.language?.startsWith('ru') ? 'ru' : 'en'
    const redirectUrl = `${window.location.origin}/miniapp/redirect.html?url=${encodeURIComponent(app.deepLink)}&lang=${lang}`
    const tg = (window as unknown as { Telegram?: { WebApp?: { openLink?: (url: string, options?: object) => void } } }).Telegram?.WebApp
    if (tg?.openLink) {
      try {
        tg.openLink(redirectUrl, { try_instant_view: false, try_browser: true })
        return
      } catch { }
    }
    window.location.href = redirectUrl
  }

  const handleDownload = (app: AppInfo) => {
    triggerHapticFeedback('light')
    const installStep = app.installationStep
    if (!installStep?.buttons?.length) return
    
    const downloadBtn = installStep.buttons.find(btn => isValidExternalUrl(btn.buttonLink))
    if (!downloadBtn?.buttonLink) return
    
    window.open(downloadBtn.buttonLink, '_blank')
  }

  const handleActivate = () => {
    triggerHapticFeedback('light')
    onClose()
    navigate('/plan')
  }

  const currentPlatformName = selectedApp ? platformNames[detectedPlatform || 'android'] : ''

  return (
    <ZenModal isOpen={true} onClose={onClose}>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-[3px] border-zen-accent/30 border-t-zen-accent rounded-full animate-spin" />
        </div>
      ) : error || !appConfig ? (
        <div className="text-center py-8">
          <p className="text-zen-sub text-lg mb-4">{t('common.error')}</p>
          <button onClick={onClose} className="px-6 py-2 bg-zen-accent text-white rounded-xl font-bold">
            {t('common.close')}
          </button>
        </div>
      ) : !appConfig.hasSubscription ? (
        <div className="text-center py-8">
          <h3 className="font-display text-2xl font-bold text-zen-text mb-3">
            {t('zen.access.title', 'Access Required')}
          </h3>
          <p className="text-zen-sub mb-6 whitespace-pre-line">
            {t('zen.access.subtitle', 'Activate your subscription to unleash the flow.')}
          </p>
          <button 
            onClick={handleActivate} 
            className="w-full py-4 bg-gradient-to-r from-emerald-400 to-teal-600 text-white rounded-xl font-bold text-lg shadow-glow btn-press"
          >
            {t('zen.access.activate', 'Activate')}
          </button>
        </div>
      ) : (
        <>
          <h3 className="font-display text-2xl font-bold text-zen-text mb-2">
            {t('zen.setup.title', 'Setup Connection')}
          </h3>
          <p className="text-zen-sub text-sm mb-6 font-medium">
            {t('zen.setup.subtitle', 'One-time setup to unlock your flow.')}
          </p>
          
          {selectedApp && (
            <div className="space-y-3 mb-8">
              <button
                onClick={() => handleDownload(selectedApp)}
                className="w-full bg-zen-bg border border-zen-sub/10 p-4 rounded-2xl flex items-center gap-4 hover:bg-zen-sub/5 transition active:scale-[0.98] text-left"
              >
                <div className={`w-10 h-10 rounded-xl ${platformColors[detectedPlatform || 'android']} text-white flex items-center justify-center`}>
                  {getAppIcon(selectedApp.name)}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-zen-text">{selectedApp.name}</h4>
                  <p className="text-xs text-zen-sub">{currentPlatformName}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white dark:bg-zen-card flex items-center justify-center text-zen-accent shadow-sm">
                  <DownloadIcon />
                </div>
              </button>
            </div>
          )}
          
          {selectedApp?.deepLink && (
            <button
              onClick={() => handleConnect(selectedApp)}
              className="w-full py-4 bg-zen-text text-white dark:bg-zen-accent rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 btn-press mb-4 hover:opacity-90 transition-opacity"
            >
              <MagicIcon />
              <span>{t('zen.setup.autoAdd', 'Auto-Add Config')}</span>
            </button>
          )}
          
          <button
            onClick={copySubscriptionLink}
            className={`w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all mb-4 ${
              copied
                ? 'bg-zen-accent/10 text-zen-accent border border-zen-accent/30'
                : 'bg-zen-sub/10 text-zen-sub hover:bg-zen-sub/20'
            }`}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? t('subscription.connection.copied') : t('subscription.connection.copyLink')}
          </button>
          
          <p className="text-center text-xs text-zen-sub font-medium">
            {t('zen.setup.hint', 'Tap "Auto-Add" after installing the app')}
          </p>
        </>
      )}
    </ZenModal>
  )
}
