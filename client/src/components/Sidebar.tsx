import React from 'react';
import { Calendar, Send } from 'lucide-react';

interface SidebarProps {
    activeTab: 'scheduled' | 'sent';
    setActiveTab: (tab: 'scheduled' | 'sent') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
    return (
        <aside className="w-64 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 fixed left-0 top-0">
            <div className="h-full px-3 pb-4 overflow-y-auto bg-white">
                <ul className="space-y-2 font-medium">
                    <li>
                        <button
                            onClick={() => setActiveTab('scheduled')}
                            className={`flex items-center p-2 rounded-lg w-full group ${activeTab === 'scheduled'
                                ? 'text-indigo-600 bg-indigo-50'
                                : 'text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            <Calendar className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" />
                            <span className="ml-3">Scheduled Emails</span>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => setActiveTab('sent')}
                            className={`flex items-center p-2 rounded-lg w-full group ${activeTab === 'sent'
                                ? 'text-indigo-600 bg-indigo-50'
                                : 'text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            <Send className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" />
                            <span className="ml-3">Sent History</span>
                        </button>
                    </li>
                </ul>
            </div>
        </aside>
    );
};

export default Sidebar;
