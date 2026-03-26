import { no } from './no'
import { en } from './en'

export type Language = 'no' | 'en'

const translations = { no, en }

export function getTranslations(lang: Language) {
  return translations[lang] ?? translations.no
}

export { no, en }
