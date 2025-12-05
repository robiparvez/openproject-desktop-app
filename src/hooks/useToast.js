import { useState, useCallback } from 'react';

/**
 * Hook to manage toast notifications
 * Provides a simple API for showing temporary notifications
 */
export function useToast() {
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    return {
        toast,
        showToast,
        hideToast
    };
}
