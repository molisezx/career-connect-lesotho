// hooks/useDashboardNavigation.js
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useDashboardNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = useCallback((path, options = {}) => {
    const { replace = false, forceRefresh = false } = options;

    if (location.pathname === path && forceRefresh) {
      // Navigate to same path to trigger component remount
      navigate(path, { replace: true });
    } else {
      navigate(path, { replace });
    }
  }, [navigate, location.pathname]);

  const handleRefresh = useCallback(() => {
    navigate(location.pathname, { replace: true });
  }, [navigate, location.pathname]);

  return {
    handleNavigation,
    handleRefresh,
    currentPath: location.pathname
  };
};
