import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import LanguageSwitcher from '../../components/LanguageSwitcher'

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)

const SupportIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
)

const ReferralIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
)

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
)

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
)

const AdminIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-5 h-5 text-zen-sub" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
)

interface MenuItemProps {
  to: string
  icon: React.ReactNode
  label: string
  rightContent?: React.ReactNode
}

function MenuItem({ to, icon, label, rightContent }: MenuItemProps) {
  return (
    <Link to={to} className="zen-card zen-card-hover p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-8 flex justify-center text-zen-sub">{icon}</div>
        <span className="font-bold text-zen-text">{label}</span>
      </div>
      {rightContent || <ChevronRightIcon />}
    </Link>
  )
}

export default function MenuTab() {
  const { t } = useTranslation()
  const { user, logout, isAdmin } = useAuthStore()

  return (
    <div className="space-y-6">
      <div className="zen-card p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-zen-accent/10 flex items-center justify-center text-zen-accent">
          <UserIcon />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zen-text">
            {user?.first_name || user?.username || 'User'}
          </h2>
          <p className="text-xs text-zen-accent font-bold bg-zen-accent/10 px-2 py-0.5 rounded-md inline-block">
            ID: {user?.telegram_id}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <MenuItem to="/profile" icon={<UserIcon />} label={t('nav.profile')} />
        <MenuItem to="/support" icon={<SupportIcon />} label={t('nav.support')} />
        <MenuItem to="/referral" icon={<ReferralIcon />} label={t('nav.referral')} />
        <MenuItem to="/info" icon={<InfoIcon />} label={t('nav.info')} />
      </div>

      <div className="zen-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 flex justify-center text-zen-sub">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
            </svg>
          </div>
          <span className="font-bold text-zen-text">{t('profile.language')}</span>
        </div>
        <LanguageSwitcher />
      </div>

      {isAdmin && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-warning-500 uppercase tracking-widest pl-1">
            {t('admin.nav.title')}
          </h3>
          <Link 
            to="/admin" 
            className="zen-card zen-card-hover p-4 flex items-center justify-between border-warning-500/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 flex justify-center text-warning-500">
                <AdminIcon />
              </div>
              <span className="font-bold text-warning-500">{t('admin.nav.title')}</span>
            </div>
            <ChevronRightIcon />
          </Link>
        </div>
      )}

      <button
        onClick={logout}
        className="zen-card zen-card-hover p-4 flex items-center gap-4 w-full text-left text-error-400"
      >
        <div className="w-8 flex justify-center">
          <LogoutIcon />
        </div>
        <span className="font-bold">{t('nav.logout')}</span>
      </button>
    </div>
  )
}
