import React from 'react';
import type { User } from '../hooks/useAuth';
import { authApi } from '../api/client';
import { LogOut } from 'lucide-react';

interface NavbarProps {
    user: User;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
    const handleLogout = async () => {
        try {
            await authApi.post('/logout');
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <nav className="bg-white border-b border-gray-200 px-4 py-2.5 fixed left-0 right-0 top-0 z-50">
            <div className="flex flex-wrap justify-between items-center">
                <div className="flex justify-start items-center">
                    <span className="self-center text-xl font-semibold whitespace-nowrap text-indigo-600">
                        Email Scheduler
                    </span>
                </div>
                <div className="flex items-center lg:order-2">
                    <div className="flex items-center mr-4">
                        {user.avatar ? (
                            <img
                                className="w-8 h-8 rounded-full mr-2"
                                src={user.avatar}
                                alt={user.name}
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 font-bold">
                                {user.name.charAt(0)}
                            </div>
                        )}
                        <span className="text-sm font-medium text-gray-700 hidden sm:block">
                            {user.name}
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-gray-500 hover:bg-gray-100 focus:ring-4 focus:ring-gray-300 rounded-lg text-sm p-2.5 inline-flex items-center"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
