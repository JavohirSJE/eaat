// ============================================
// i18n - INTERNATIONALIZATION SETUP
// ============================================

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Uzbek Latin
import uzCommon from './locales/uz/common.json';
import uzAuth from './locales/uz/auth.json';
import uzOrganization from './locales/uz/organization.json';
import uzDepartment from './locales/uz/department.json';
import uzEmployee from './locales/uz/employee.json';
import uzMessages from './locales/uz/messages.json';

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    // Default language
    lng: localStorage.getItem('language') || 'uz',
    
    // Fallback language
    fallbackLng: 'uz',
    
    // Debug mode
    debug: import.meta.env.DEV,
    
    // Interpolation
    interpolation: {
      escapeValue: false,
    },
    
    // Namespaces
    ns: ['common', 'auth', 'organization', 'department', 'employee', 'messages'],
    defaultNS: 'common',
    
    // Resources
    resources: {
      uz: {
        common: uzCommon,
        auth: uzAuth,
        organization: uzOrganization,
        department: uzDepartment,
        employee: uzEmployee,
        messages: uzMessages,
      },
      // Additional languages will be added here
      // ru: { ... }
      // 'uz-Cyrl': { ... }
    },
  });

/**
 * Language change handler
 */
export const changeLanguage = (lang: string): void => {
  i18n.changeLanguage(lang);
  localStorage.setItem('language', lang);
};

/**
 * Get current language
 */
export const getCurrentLanguage = (): string => {
  return i18n.language;
};

/**
 * Available languages
 */
export const AVAILABLE_LANGUAGES = [
  { code: 'uz', name: 'Uzbek Latin', flag: '🇺🇿' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'uz-Cyrl', name: 'Uzbek Cyrillic', flag: '🇺🇿' },
];

export default i18n;
