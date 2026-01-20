import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/client';

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
}

export const useAuth = () => {
    return useQuery<User>({
        queryKey: ['me'],
        queryFn: async () => {
            const res = await authApi.get('/me');
            return res.data;
        },
        retry: false,
        staleTime: Infinity,
    });
};
