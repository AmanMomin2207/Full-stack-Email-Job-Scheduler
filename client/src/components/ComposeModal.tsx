import React, { useState } from 'react';
import { X, Upload, Calendar, Clock, AlertCircle } from 'lucide-react';
import api from '../api/client';

interface ComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [scheduledAt, setScheduledAt] = useState('');
    const [delaySeconds, setDelaySeconds] = useState(2);
    const [hourlyLimit, setHourlyLimit] = useState(100);
    const [uploading, setUploading] = useState(false);
    const [recipientCount, setRecipientCount] = useState<number | null>(null);
    const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setError('');

            const formData = new FormData();
            formData.append('file', selectedFile);

            try {
                setUploading(true);
                const { data } = await api.post('/parse-csv', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setRecipientCount(data.count);
                setRecipientEmails(data.emails);
            } catch (err) {
                console.error('Failed to parse CSV', err);
                setError('Failed to parse CSV file. Please ensure it has an "email" column.');
                setFile(null);
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipientEmails.length) {
            setError('Please upload a valid CSV file with recipients.');
            return;
        }
        if (!scheduledAt) {
            setError('Please select a start time.');
            return;
        }

        try {
            setLoading(true);
            await api.post('/schedule', {
                emails: recipientEmails,
                subject,
                body,
                startTime: scheduledAt,
                delaySeconds: Number(delaySeconds),
                hourlyLimit: Number(hourlyLimit)
            });
            setLoading(false);
            onSuccess();
        } catch (err) {
            console.error(err);
            setError('Failed to schedule campaign.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-900">
                        New Email Campaign
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            {error}
                        </div>
                    )}

                    {/* Step 1: Recipients */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">Recipients (CSV)</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-gray-500">CSV file with 'email' column</p>
                                </div>
                                <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                            </label>
                        </div>
                        {uploading && <p className="mt-2 text-sm text-blue-600">Parsing CSV...</p>}
                        {recipientCount !== null && !uploading && (
                            <p className="mt-2 text-sm text-green-600">Found {recipientCount} recipients.</p>
                        )}
                    </div>

                    {/* Step 2: Content */}
                    <div className="grid gap-6 mb-6 md:grid-cols-2">
                        <div className="col-span-2">
                            <label className="block mb-2 text-sm font-medium text-gray-900">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                                placeholder="Campaign Subject"
                                required
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block mb-2 text-sm font-medium text-gray-900">Email Body (HTML supported)</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={4}
                                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Write your email content here..."
                                required
                            ></textarea>
                        </div>
                    </div>

                    {/* Step 3: Scheduling */}
                    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                        <h4 className="font-medium text-gray-900 flex items-center">
                            <Clock className="w-5 h-5 mr-2" /> Scheduling & Limits
                        </h4>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900">Start Time</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) => setScheduledAt(e.target.value)}
                                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900">Delay per Email (seconds)</label>
                                <input
                                    type="number"
                                    value={delaySeconds}
                                    onChange={(e) => setDelaySeconds(Number(e.target.value))}
                                    min="1"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900">Hourly Limit</label>
                                <input
                                    type="number"
                                    value={hourlyLimit}
                                    onChange={(e) => setHourlyLimit(Number(e.target.value))}
                                    min="1"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50"
                        >
                            {loading ? 'Scheduling...' : 'Schedule Campaign'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ComposeModal;
