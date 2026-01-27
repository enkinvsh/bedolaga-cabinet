import { useTranslation } from 'react-i18next'
import { useState, useRef, useEffect } from 'react'
import { triggerHapticFeedback } from '../hooks/useBackButton'

const languages = [
  { code: 'ru', name: 'RU', flag: '🇷🇺', fullName: 'Русский' },
  { code: 'en', name: 'EN', flag: '🇬🇧', fullName: 'English' },
  { code: 'zh', name: 'ZH', flag: '🇨🇳', fullName: '中文' },
  { code: 'fa', name: 'FA', flag: '🇮🇷', fullName: 'فارسی' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const changeLanguage = (code: string) => {
    triggerHapticFeedback('light')
    i18n.changeLanguage(code)
    document.documentElement.dir = code === 'fa' ? 'rtl' : 'ltr'
    setIsOpen(false)
  }

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'fa' ? 'rtl' : 'ltr'
  }, [i18n.language])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          triggerHapticFeedback('light')
          setIsOpen(!isOpen)
        }}
        className="px-3 py-1.5 rounded-full bg-zen-sub/10 text-zen-sub border border-zen-sub/20 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 hover:bg-zen-sub/15 transition-colors z-10"
        aria-label="Change language"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        {currentLang.name}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-36 zen-card rounded-xl shadow-lg py-1 z-50 animate-fade-in">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                lang.code === i18n.language
                  ? 'bg-zen-accent/10 text-zen-accent'
                  : 'text-zen-sub hover:bg-zen-accent/5 hover:text-zen-text'
              }`}
            >
              <span>{lang.flag}</span>
              <span className="font-medium">{lang.fullName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
