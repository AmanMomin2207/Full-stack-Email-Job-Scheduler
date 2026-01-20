import React from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface EmailJob {
    id: string;
    recipient: string;
    subject: string;
    status: 'PENDING' | 'SENT' | 'FAILED';
    scheduledAt: string;
    sentAt?: string;
    createdAt: string;
}

interface EmailRowProps {
    email: EmailJob;
}

const EmailRow: React.FC<EmailRowProps> = ({ email }) => {
    const getStatusIcon = () => {
        switch (email.status) {
            case 'SENT':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'FAILED':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-yellow-500" />;
        }
    };

    const getStatusClass = () => {
        switch (email.status) {
            case 'SENT':
                return 'bg-green-100 text-green-800';
            case 'FAILED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <tr className="bg-white border-b hover:bg-gray-50">
            <td className="w-4 p-4">
                <div className="flex items-center">
                    {getStatusIcon()}
                </div>
            </td>
            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                {email.recipient}
            </td>
            <td className="px-6 py-4 text-gray-500">
                {email.subject}
            </td>
            <td className="px-6 py-4 text-gray-500">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusClass()}`}>
                    {email.status}
                </span>
            </td>
            <td className="px-6 py-4 text-gray-500">
                {new Date(email.scheduledAt).toLocaleString()}
            </td>
        </tr>
    );
};

export default EmailRow;
