import React, { useState } from 'react';
import ProfileReview from './ProfileReview';
import ReportHandling from './ReportHandling';
import SensitiveWordManagement from './SensitiveWordManagement';
import MatchmakerSettings from './MatchmakerSettings';

export default function MatchmakerAdmin() {
    const [view, setView] = useState('review');

    const tabs = [
        { key: 'review', label: 'Profile Review' },
        { key: 'reports', label: 'Report Handling' },
        { key: 'words', label: 'Sensitive Words' },
        { key: 'settings', label: 'Settings' },
    ];

    const renderView = () => {
        switch (view) {
            case 'review':
                return <ProfileReview />;
            case 'reports':
                return <ReportHandling />;
            case 'words':
                return <SensitiveWordManagement />;
            case 'settings':
                return <MatchmakerSettings />;
            default:
                return <ProfileReview />;
        }
    };

    return (
        <div className="mt-4">
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setView(tab.key)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${view === tab.key
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div>
                {renderView()}
            </div>
        </div>
    );
}