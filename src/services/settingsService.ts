/**
 * Settings Service
 * Client-side service for managing global settings
 * Requirements: 5.1-5.5, 6.1-6.5, 7.1-7.5
 */

import { api } from '@/lib/api';

export interface FontSettings {
  family: string;
  baseSize: number;
  headingScale: number;
  lineHeight: number;
  source: 'system' | 'google';
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
}

export interface ColorSettings {
  light: ColorPalette;
  dark: ColorPalette;
}

export interface LayoutSettings {
  sidebarWidth: number;
  containerMaxWidth: number;
  sectionSpacing: number;
  buttonStyle: 'rounded' | 'square' | 'pill';
}

export interface GlobalSettings {
  fonts: FontSettings;
  colors: ColorSettings;
  layout: LayoutSettings;
  updatedAt: string;
  updatedBy: string;
}

export interface CSSVariables {
  [key: string]: string;
}

/**
 * Load all settings
 * Requirements: 5.3, 6.3, 7.3
 */
export async function loadSettings(): Promise<GlobalSettings> {
  const response = await api.get<{ ok: boolean; data: GlobalSettings }>('/api/admin/settings');
  return response.data;
}

/**
 * Get CSS variables for current settings
 * Requirements: 5.5, 6.4, 7.5
 */
export async function getCSSVariables(theme: 'light' | 'dark' = 'light'): Promise<CSSVariables> {
  const response = await api.get<{ ok: boolean; data: CSSVariables }>(
    `/api/admin/settings/css-variables?theme=${theme}`
  );
  return response.data;
}

/**
 * Update font settings
 * Requirements: 5.1-5.5
 */
export async function updateFontSettings(
  fontSettings: Partial<FontSettings>
): Promise<GlobalSettings> {
  const response = await api.put<{ ok: boolean; data: GlobalSettings }>(
    '/api/admin/settings/fonts',
    fontSettings
  );
  return response.data;
}

/**
 * Update color settings
 * Requirements: 6.1-6.5
 */
export async function updateColorSettings(
  colorSettings: Partial<ColorSettings>
): Promise<GlobalSettings> {
  const response = await api.put<{ ok: boolean; data: GlobalSettings }>(
    '/api/admin/settings/colors',
    colorSettings
  );
  return response.data;
}

/**
 * Update layout settings
 * Requirements: 7.1-7.5
 */
export async function updateLayoutSettings(
  layoutSettings: Partial<LayoutSettings>
): Promise<GlobalSettings> {
  const response = await api.put<{ ok: boolean; data: GlobalSettings }>(
    '/api/admin/settings/layout',
    layoutSettings
  );
  return response.data;
}

/**
 * Update all settings at once
 * Requirements: 5.5, 6.5, 7.5
 */
export async function updateAllSettings(
  settings: Partial<GlobalSettings>
): Promise<GlobalSettings> {
  const response = await api.put<{ ok: boolean; data: GlobalSettings }>(
    '/api/admin/settings',
    settings
  );
  return response.data;
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<GlobalSettings> {
  const response = await api.post<{ ok: boolean; data: GlobalSettings }>(
    '/api/admin/settings/reset',
    {}
  );
  return response.data;
}

/**
 * Apply CSS variables to document root
 * Requirements: 5.2, 5.4, 6.2, 7.2
 */
export function applyCSSVariables(variables: CSSVariables): void {
  const root = document.documentElement;
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

/**
 * Convert settings to CSS variables
 * Requirements: 5.5, 6.4, 7.5
 */
export function settingsToCSSVariables(
  settings: GlobalSettings,
  theme: 'light' | 'dark' = 'light'
): CSSVariables {
  // Safety check
  if (!settings || !settings.colors || !settings.fonts || !settings.layout) {
    if (import.meta.env.DEV) {
      console.error('Invalid settings object:', settings);
    }
    return {};
  }

  const colors = settings.colors[theme];

  if (!colors) {
    if (import.meta.env.DEV) {
      console.error(`No colors found for theme: ${theme}`);
    }
    return {};
  }

  return {
    // Font variables
    '--font-family': settings.fonts.family,
    '--font-size-base': `${settings.fonts.baseSize}px`,
    '--font-size-heading': `${settings.fonts.baseSize * settings.fonts.headingScale}px`,
    '--line-height': settings.fonts.lineHeight.toString(),

    // Color variables
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-accent': colors.accent,
    '--color-background': colors.background,
    '--color-foreground': colors.foreground,
    '--color-muted': colors.muted,
    '--color-border': colors.border,

    // Layout variables
    '--sidebar-width': `${settings.layout.sidebarWidth}px`,
    '--container-max-width': `${settings.layout.containerMaxWidth}px`,
    '--section-spacing': `${settings.layout.sectionSpacing}px`,
    '--button-radius':
      settings.layout.buttonStyle === 'rounded'
        ? '8px'
        : settings.layout.buttonStyle === 'pill'
          ? '9999px'
          : '0px',
  };
}
