import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ComposeModal from '../components/ComposeModal';
import EmailRow from '../components/EmailRow';
import { useAuth } from '../hooks/useAuth';
import { Plus } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { data: user, isLoading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    const { data: emails, refetch } = useQuery({
        queryKey: ['emails', activeTab],
        queryFn: async () => {
            const endpoint = activeTab === 'scheduled' ? '/scheduled-emails' : '/sent-emails';
            const { data } = await api.get(endpoint);
            return data;
        },
        enabled: !!user,
    });

    if (authLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
    if (!user) return <div>Access Denied</div>;

    return (
        <div className="bg-gray-50 min-h-screen">
            <Navbar user={user} />
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="p-4 sm:ml-64 pt-20">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {activeTab === 'scheduled' ? 'Scheduled Emails' : 'Sent History'}
                    </h1>
                    <button
                        onClick={() => setIsComposeOpen(true)}
                        className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Compose Email
                    </button>
                </div>

                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="p-4">Status</th>
                                <th scope="col" className="px-6 py-3">Recipient</th>
                                <th scope="col" className="px-6 py-3">Subject</th>
                                <th scope="col" className="px-6 py-3">State</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {emails?.length === 0 ? (
                                <tr className="bg-white border-b">
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                        No emails found.
                                    </td>
                                </tr>
                            ) : (
                                emails?.map((email: any) => (
                                    <EmailRow key={email.id} email={email} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ComposeModal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                onSuccess={() => {
                    setIsComposeOpen(false);
                    refetch();
                }}
            />
        </div>
    );
};

export default Dashboard;
