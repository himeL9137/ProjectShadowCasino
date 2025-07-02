import React, { useState } from 'react';
import { useAppSelector } from '../../lib/store/hooks';
import { toast } from 'react-toastify';
import * as api from '../../lib/api';
import { fetchBalance } from '../../lib/store/thunks/walletThunks';
import { useAppDispatch } from '../../lib/store/hooks';

interface AdminControlsProps {
  userId?: number; // If not provided, use current user
}

const AdminControls: React.FC<AdminControlsProps> = ({ userId }) => {
  const dispatch = useAppDispatch();
  const { currency } = useAppSelector((state) => state.wallet);
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input with decimal point
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  // Add funds
  const handleAddFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      // Use the API to adjust balance
      const targetUserId = userId || 'current'; // Use 'current' for current user
      const response = await api.post(`/api/admin/adjust-balance`, {
        userId: targetUserId,
        amount: parseFloat(amount),
        action: 'add',
      });

      const data = await response.json();
      toast.success(`Successfully added ${amount} ${currency} to user #${targetUserId}`);
      setAmount('');
      
      // Refresh balance
      dispatch(fetchBalance());
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to add funds. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove funds
  const handleRemoveFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      // Use the API to adjust balance
      const targetUserId = userId || 'current'; // Use 'current' for current user
      const response = await api.post(`/api/admin/adjust-balance`, {
        userId: targetUserId,
        amount: parseFloat(amount),
        action: 'remove',
      });

      const data = await response.json();
      toast.success(`Successfully removed ${amount} ${currency} from user #${targetUserId}`);
      setAmount('');
      
      // Refresh balance
      dispatch(fetchBalance());
    } catch (error) {
      console.error('Error removing funds:', error);
      toast.error('Failed to remove funds. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-md p-4">
      <h3 className="text-lg font-medium mb-4">Admin Controls</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="amount-input" className="block text-sm font-medium mb-1">
            Amount ({currency})
          </label>
          <input
            id="amount-input"
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="w-full p-2 border border-input rounded-md bg-background"
            placeholder={`Enter amount in ${currency}`}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleAddFunds}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Add Funds'}
          </button>
          
          <button
            onClick={handleRemoveFunds}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Remove Funds'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminControls;