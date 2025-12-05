import { useState, useEffect } from 'react';

/**
 * Hook to manage OpenProject settings (API token, base URL)
 * Similar to useSettings from Activity Tracker
 */
export function useSettings(showToast) {
    const [formData, setFormData] = useState({ apiToken: '', baseUrl: 'https://pm.reddotdigitalltd.com' });
    const [errors, setErrors] = useState({});
    const [testStatus, setTestStatus] = useState(null);
    const [testing, setTesting] = useState(false);

    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            if (window.electronAPI) {
                const loaded = await window.electronAPI.getSettings();
                setFormData({
                    apiToken: loaded.apiToken || '',
                    baseUrl: loaded.baseUrl || 'https://pm.reddotdigitalltd.com'
                });
            }
        };
        loadSettings();
    }, []);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setTestStatus(null);
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const testConnection = async () => {
        setTesting(true);
        setTestStatus(null);

        try {
            if (window.electronAPI) {
                // Save first, then test
                await window.electronAPI.saveSettings(formData);

                const result = await window.electronAPI.apiRequest({
                    method: 'GET',
                    endpoint: '/users/me'
                });

                if (result.success) {
                    setTestStatus({ success: true, user: result.data.name });
                    if (showToast) showToast('Connection successful!', 'success');
                } else {
                    setTestStatus({ success: false, error: result.error });
                }
            }
        } catch (err) {
            setTestStatus({ success: false, error: err.message });
        } finally {
            setTesting(false);
        }
    };

    const saveSettings = async () => {
        try {
            if (window.electronAPI) {
                const saved = await window.electronAPI.saveSettings(formData);
                setFormData(saved);
                if (showToast) showToast('Settings saved successfully', 'success');
                return { success: true };
            }
        } catch (err) {
            if (showToast) showToast('Failed to save settings', 'error');
            return { success: false, error: err.message };
        }
    };

    return {
        formData,
        errors,
        testStatus,
        testing,
        handleChange,
        testConnection,
        saveSettings
    };
}
