import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { triggerHapticFeedback } from '../../hooks/useBackButton'

const BoltIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
)

const WalletIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
)

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
)

interface Tab {
  id: string
  path: string
  labelKey: string
  Icon: React.FC
}

const TABS: Tab[] = [
  { id: 'flow', path: '/', labelKey: 'zen.tabs.flow', Icon: BoltIcon },
  { id: 'plan', path: '/plan', labelKey: 'zen.tabs.plan', Icon: WalletIcon },
  { id: 'menu', path: '/menu', labelKey: 'zen.tabs.menu', Icon: MenuIcon },
]

export default function ZenBottomNav() {
  const { t } = useTranslation()

  const handleTabClick = () => {
    triggerHapticFeedback('light')
  }

  return (
    <nav className="zen-bottom-nav">
      <div className="flex justify-between items-center max-w-sm mx-auto px-6 pt-2 pb-6">
        {TABS.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.path}
            onClick={handleTabClick}
            className={({ isActive }) =>
              `w-16 h-14 flex flex-col items-center justify-center gap-1 group transition-all duration-300 ${
                isActive ? '' : 'opacity-40 hover:opacity-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`transition-colors duration-300 ${isActive ? 'text-zen-accent drop-shadow-sm' : 'text-zen-text'}`}>
                  <tab.Icon />
                </div>
                <span className={`text-[11px] font-extrabold tracking-wide transition-colors duration-300 ${isActive ? 'text-zen-text' : 'text-zen-text'}`}>
                  {t(tab.labelKey)}
                </span>
                <div className={`w-1 h-1 rounded-full bg-zen-accent mt-0.5 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
