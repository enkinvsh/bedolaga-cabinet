import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { triggerHapticFeedback } from '../hooks/useBackButton'

const languages = [
  { code: 'ru', name: 'RU' },
  { code: 'en', name: 'EN' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0]

  const toggleLanguage = () => {
    triggerHapticFeedback('light')
    const nextLang = i18n.language === 'en' ? 'ru' : 'en'
    i18n.changeLanguage(nextLang)
  }

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'fa' ? 'rtl' : 'ltr'
  }, [i18n.language])

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1.5 rounded-full bg-zen-sub/10 text-zen-sub border border-zen-sub/20 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 hover:bg-zen-sub/15 transition-colors z-10 font-[Manrope]"
      aria-label="Change language"
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
      {currentLang.name}
    </button>
  )
}
