import { useQuery, useQueryClient } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { useAuth } from './use-auth';

interface WalletData {
  balance: string;
  currency: string;
}

export function useWallet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<WalletData>({
    queryKey: ['/api/wallet/balance'],
    enabled: !!user,
  });

  const refetchBalance = async () => {
    await refetch();
  };

  return {
    balance: parseFloat(data?.balance || '0'),
    currency: data?.currency || 'USD',
    isLoading,
    error,
    refetchBalance,
  };
}