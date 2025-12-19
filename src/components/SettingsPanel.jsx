import React from 'react';
import { Save, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

function SettingsPanel({
    formData,
    errors,
    testStatus,
    testing,
    onFieldChange,
    onTest,
    onSave,
    onNext
}) {
    const isValid = formData.apiToken.trim() && formData.baseUrl.trim();

    return (
        <div className='bg-card rounded-lg border border-border p-6 shadow-sm'>
            <div className='space-y-6'>
                <div>
                    <label className='block text-sm font-medium text-foreground mb-2'>Server URL</label>
                    <input
                        type='url'
                        name='baseUrl'
                        value={formData.baseUrl}
                        onChange={onFieldChange}
                        placeholder='https://pm.reddotdigitalltd.com'
                        className='w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all'
                    />
                    {errors.baseUrl && <p className='mt-1 text-sm text-red-600'>{errors.baseUrl}</p>}
                </div>

                <div>
                    <label className='block text-sm font-medium text-foreground mb-2'>API Token</label>
                    <input
                        type='password'
                        name='apiToken'
                        value={formData.apiToken}
                        onChange={onFieldChange}
                        placeholder='Enter your OpenProject API token'
                        className='w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all'
                    />
                    <p className='mt-2 text-sm text-muted-foreground'>Get your token from OpenProject → My Account → Access Tokens</p>
                    {errors.apiToken && <p className='mt-1 text-sm text-red-600'>{errors.apiToken}</p>}
                </div>

                {/* Test Connection Status */}
                {testStatus && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 border ${testStatus.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        {testStatus.success ? (
                            <>
                                <CheckCircle className='w-5 h-5 text-green-600' />
                                <span>
                                    Connected as: <strong>{testStatus.user}</strong>
                                </span>
                            </>
                        ) : (
                            <>
                                <XCircle className='w-5 h-5 text-red-600' />
                                <span>{testStatus.error}</span>
                            </>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className='flex gap-3 pt-4'>
                    <button
                        onClick={onTest}
                        disabled={!isValid || testing}
                        className='flex items-center gap-2 px-6 py-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all font-medium text-sm border border-border'
                    >
                        {testing ? 'Testing...' : 'Test Connection'}
                    </button>

                    <button
                        onClick={onSave}
                        disabled={!isValid}
                        className='flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all font-medium text-sm shadow-sm'
                    >
                        <Save className='w-4 h-4' />
                        Save Settings
                    </button>

                    {testStatus?.success && (
                        <button
                            onClick={onNext}
                            className='ml-auto flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all font-medium text-sm shadow-sm'
                        >
                            Continue to Upload →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SettingsPanel;
