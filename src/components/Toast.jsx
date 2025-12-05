import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const ICONS = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
};

const COLORS = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
};

function Toast({ message, type = 'info' }) {
    const Icon = ICONS[type] || ICONS.info;
    const colorClass = COLORS[type] || COLORS.info;

    return (
        <div className='fixed bottom-6 right-6 z-50 animate-slide-up'>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${colorClass}`}>
                <Icon className='w-5 h-5 flex-shrink-0' />
                <span className='text-sm font-medium'>{message}</span>
            </div>
        </div>
    );
}

export default Toast;
