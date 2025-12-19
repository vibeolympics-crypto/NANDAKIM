import { useState, useCallback } from 'react';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface UsePreviewOptions {
  initialDevice?: DeviceType;
  initialTheme?: 'light' | 'dark';
}

export function usePreview(options: UsePreviewOptions = {}) {
  const [device, setDevice] = useState<DeviceType>(options.initialDevice || 'desktop');
  const [theme, setTheme] = useState<'light' | 'dark'>(options.initialTheme || 'light');
  const [isFullPreview, setIsFullPreview] = useState(false);

  const handleDeviceChange = useCallback((newDevice: DeviceType) => {
    setDevice(newDevice);
  }, []);

  const handleThemeChange = useCallback((newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  }, []);

  const openFullPreview = useCallback(() => {
    setIsFullPreview(true);
  }, []);

  const closeFullPreview = useCallback(() => {
    setIsFullPreview(false);
  }, []);

  const toggleFullPreview = useCallback(() => {
    setIsFullPreview((prev) => !prev);
  }, []);

  return {
    device,
    theme,
    isFullPreview,
    setDevice: handleDeviceChange,
    setTheme: handleThemeChange,
    openFullPreview,
    closeFullPreview,
    toggleFullPreview,
  };
}
