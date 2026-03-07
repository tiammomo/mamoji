/**
 * 国际化配置
 *
 * 使用方法:
 * import { useTranslation } from '@/lib/i18n';
 *
 * const { t } = useTranslation();
 * return <h1>{t('common.welcome')}</h1>
 */

import 'next-intl';

// 支持的语言
export const locales = ['zh-CN', 'en-US'] as const;
export type Locale = (typeof locales)[number];

// 默认语言
export const defaultLocale: Locale = 'zh-CN';

// 语言名称映射
export const localeNames: Record<Locale, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English',
};

// 命名空间
export const namespaces = ['common', 'auth', 'account', 'transaction', 'category', 'budget', 'settings'] as const;
export type Namespace = (typeof namespaces)[number];
