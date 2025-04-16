import { useCallback, useState } from 'react';

export type ViewMode = 'bottom' | 'side';

export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>('side');

  const toggleViewMode = useCallback(() => {
    setViewMode((current) => (current === 'bottom' ? 'side' : 'bottom'));
  }, []);

  return {
    viewMode,
    toggleViewMode,
    isSideView: viewMode === 'side',
  };
}
