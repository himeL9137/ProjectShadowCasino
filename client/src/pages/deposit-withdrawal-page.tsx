import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, CreditCard, Smartphone, Building, Globe, Shield, MessageSquare, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useWallet } from '@/hooks/use-wallet';
import { toast } from '@/hooks/use-toast';
import { post } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTheme } from '@/hooks/use-theme';


interface PaymentMethod {
  id: string;
  name: string;
  type: 'mobile' | 'internet' | 'card' | 'bank';
  icon: string;
  fees: string;
  minAmount: number;
  maxAmount: number;
  processingTime: string;
  isActive: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  // Mobile Wallets (MFS)
  { id: 'visa_mobile', name: 'VISA Mobile', type: 'mobile', icon: '💳', fees: '2.5%', minAmount: 20, maxAmount: 50000, processingTime: 'Instant', isActive: true },
  { id: 'bkash', name: 'bKash', type: 'mobile', icon: '📱', fees: '1.85%', minAmount: 10, maxAmount: 25000, processingTime: 'Instant', isActive: true },
  { id: 'nagad', name: 'Nagad', type: 'mobile', icon: '📱', fees: '1.99%', minAmount: 10, maxAmount: 25000, processingTime: 'Instant', isActive: true },
  { id: 'rocket', name: 'Rocket', type: 'mobile', icon: '🚀', fees: '1.8%', minAmount: 10, maxAmount: 50000, processingTime: 'Instant', isActive: true },
  { id: 'upay', name: 'Upay', type: 'mobile', icon: '📱', fees: '1.75%', minAmount: 10, maxAmount: 25000, processingTime: 'Instant', isActive: true },
  { id: 'surecash', name: 'SureCash', type: 'mobile', icon: '📱', fees: '1.85%', minAmount: 10, maxAmount: 25000, processingTime: 'Instant', isActive: true },
  { id: 'okwallet', name: 'OK Wallet', type: 'mobile', icon: '💳', fees: '1.8%', minAmount: 10, maxAmount: 25000, processingTime: 'Instant', isActive: true },
  { id: 'mcash', name: 'mCash', type: 'mobile', icon: '📱', fees: '1.5%', minAmount: 10, maxAmount: 30000, processingTime: 'Instant', isActive: true },
  { id: 'cellfin', name: 'CellFin', type: 'mobile', icon: '📱', fees: '1.5%', minAmount: 10, maxAmount: 30000, processingTime: 'Instant', isActive: true },
  { id: 'tcash', name: 't-cash', type: 'mobile', icon: '📱', fees: '1.9%', minAmount: 10, maxAmount: 20000, processingTime: 'Instant', isActive: true },

  // Internet Banking
  { id: 'nexuspay', name: 'DBBL NexusPay', type: 'internet', icon: '🌐', fees: '1.2%', minAmount: 50, maxAmount: 100000, processingTime: '5-15 min', isActive: true },
  { id: 'citytouch', name: 'Citytouch (City Bank)', type: 'internet', icon: '🌐', fees: '1.1%', minAmount: 50, maxAmount: 100000, processingTime: '5-15 min', isActive: true },
  { id: 'astha', name: 'BRAC Bank Astha', type: 'internet', icon: '🌐', fees: '1.0%', minAmount: 50, maxAmount: 150000, processingTime: '5-15 min', isActive: true },
  { id: 'skybanking', name: 'EBL Skybanking', type: 'internet', icon: '🌐', fees: '1.15%', minAmount: 50, maxAmount: 100000, processingTime: '5-15 min', isActive: true },
  { id: 'mtbsmart', name: 'MTB Smart Banking', type: 'internet', icon: '🌐', fees: '1.25%', minAmount: 50, maxAmount: 100000, processingTime: '5-15 min', isActive: true },
  { id: 'agranibank', name: 'Agrani Bank eBanking', type: 'internet', icon: '🌐', fees: '1.3%', minAmount: 50, maxAmount: 75000, processingTime: '10-20 min', isActive: true },
  { id: 'janatabank', name: 'Janata Bank Smart App', type: 'internet', icon: '🌐', fees: '1.4%', minAmount: 50, maxAmount: 75000, processingTime: '10-20 min', isActive: true },
  { id: 'basicbank', name: 'BASIC Bank eBanking', type: 'internet', icon: '🌐', fees: '1.5%', minAmount: 50, maxAmount: 50000, processingTime: '15-30 min', isActive: true },
  { id: 'fsibmbank', name: 'FSIBL mBanking', type: 'internet', icon: '🌐', fees: '1.2%', minAmount: 50, maxAmount: 80000, processingTime: '10-20 min', isActive: true },
  { id: 'nrbebank', name: 'NRB Bank NRB eBank', type: 'internet', icon: '🌐', fees: '1.35%', minAmount: 50, maxAmount: 75000, processingTime: '10-20 min', isActive: true },
  { id: 'aamarbank', name: 'IFIC AamarBank', type: 'internet', icon: '🌐', fees: '1.1%', minAmount: 50, maxAmount: 100000, processingTime: '5-15 min', isActive: true },
  { id: 'unionbank', name: 'Union Bank eBanking', type: 'internet', icon: '🌐', fees: '1.4%', minAmount: 50, maxAmount: 75000, processingTime: '10-20 min', isActive: true },
  { id: 'bcbebank', name: 'BCB eBanking', type: 'internet', icon: '🌐', fees: '1.45%', minAmount: 50, maxAmount: 60000, processingTime: '15-25 min', isActive: true },
  { id: 'communitybank', name: 'Community Bank Digital', type: 'internet', icon: '🌐', fees: '1.6%', minAmount: 50, maxAmount: 50000, processingTime: '15-30 min', isActive: true },
  { id: 'alarafahbank', name: 'Al-Arafah Islami Bank mBanking', type: 'internet', icon: '🌐', fees: '1.3%', minAmount: 50, maxAmount: 75000, processingTime: '10-20 min', isActive: true },
  { id: 'siblnow', name: 'Social Islami Bank SIBL Now', type: 'internet', icon: '🌐', fees: '1.25%', minAmount: 50, maxAmount: 80000, processingTime: '10-20 min', isActive: true },
  { id: 'pubalibank', name: 'Pubali Bank Mobile App', type: 'internet', icon: '🌐', fees: '1.35%', minAmount: 50, maxAmount: 75000, processingTime: '10-20 min', isActive: true },
  { id: 'ucbcorporate', name: 'UCB Corporate Internet Banking', type: 'internet', icon: '🌐', fees: '0.8%', minAmount: 100, maxAmount: 200000, processingTime: '5-10 min', isActive: true },
  { id: 'standardbank', name: 'Standard Bank Smart Banking', type: 'internet', icon: '🌐', fees: '1.1%', minAmount: 50, maxAmount: 100000, processingTime: '5-15 min', isActive: true },
  { id: 'wooribank', name: 'Woori Bank Smart Banking BD', type: 'internet', icon: '🌐', fees: '1.0%', minAmount: 50, maxAmount: 120000, processingTime: '5-15 min', isActive: true },
  { id: 'cbcebank', name: 'CBC eBanking', type: 'internet', icon: '🌐', fees: '1.4%', minAmount: 50, maxAmount: 60000, processingTime: '15-25 min', isActive: true },
  { id: 'hblkonnect', name: 'HBL Konnect', type: 'internet', icon: '🌐', fees: '1.2%', minAmount: 50, maxAmount: 100000, processingTime: '10-20 min', isActive: true },
  { id: 'citibank', name: 'Citibank NA Corporate Banking', type: 'internet', icon: '🌐', fees: '0.75%', minAmount: 100, maxAmount: 250000, processingTime: '5-10 min', isActive: true },
  { id: 'bankalfalah', name: 'Bank Alfalah mBanking', type: 'internet', icon: '🌐', fees: '1.3%', minAmount: 50, maxAmount: 80000, processingTime: '10-20 min', isActive: true },
  { id: 'abdirect', name: 'AB Direct (AB Bank)', type: 'internet', icon: '🌐', fees: '1.15%', minAmount: 50, maxAmount: 100000, processingTime: '5-15 min', isActive: true },
  { id: 'primebank', name: 'Prime Bank ALTITUDE', type: 'internet', icon: '🌐', fees: '1.0%', minAmount: 50, maxAmount: 120000, processingTime: '5-15 min', isActive: true },
  { id: 'modhumoti', name: 'Modhumoti Digital Banking', type: 'internet', icon: '🌐', fees: '1.4%', minAmount: 50, maxAmount: 70000, processingTime: '10-20 min', isActive: true },
  { id: 'bankasia', name: 'Bank Asia SMART App', type: 'internet', icon: '🌐', fees: '1.2%', minAmount: 50, maxAmount: 90000, processingTime: '5-15 min', isActive: true },
  { id: 'lankabangla', name: 'LankaBangla Financial Portal', type: 'internet', icon: '🌐', fees: '1.1%', minAmount: 50, maxAmount: 100000, processingTime: '5-15 min', isActive: true },
  { id: 'nrbcplanet', name: 'NRBC Planet App', type: 'internet', icon: '🌐', fees: '1.35%', minAmount: 50, maxAmount: 75000, processingTime: '10-20 min', isActive: true },
  { id: 'meghnabank', name: 'Meghna Bank App', type: 'internet', icon: '🌐', fees: '1.45%', minAmount: 50, maxAmount: 60000, processingTime: '15-25 min', isActive: true },
  { id: 'jamunabank', name: 'Jamuna Bank Digibank', type: 'internet', icon: '🌐', fees: '1.3%', minAmount: 50, maxAmount: 80000, processingTime: '10-20 min', isActive: true },
  { id: 'scmobile', name: 'Standard Chartered SC Mobile', type: 'internet', icon: '🌐', fees: '0.9%', minAmount: 75, maxAmount: 150000, processingTime: '5-10 min', isActive: true },
  { id: 'hsbcnet', name: 'HSBCnet (Bangladesh)', type: 'internet', icon: '🌐', fees: '0.8%', minAmount: 100, maxAmount: 200000, processingTime: '5-10 min', isActive: true },
  { id: 'midlandbank', name: 'Midland Bank MDB eBanking', type: 'internet', icon: '🌐', fees: '1.4%', minAmount: 50, maxAmount: 70000, processingTime: '15-25 min', isActive: true },
  { id: 'southeastbank', name: 'SouthEast Bank eVault', type: 'internet', icon: '🌐', fees: '1.25%', minAmount: 50, maxAmount: 85000, processingTime: '10-20 min', isActive: true },
  { id: 'eximbank', name: 'Exim Bank mBanking', type: 'internet', icon: '🌐', fees: '1.3%', minAmount: 50, maxAmount: 80000, processingTime: '10-20 min', isActive: true },
  { id: 'shahjalal', name: 'Shahjalal Islami Bank mBanking', type: 'internet', icon: '🌐', fees: '1.35%', minAmount: 50, maxAmount: 75000, processingTime: '10-20 min', isActive: true },
  { id: 'mercantilebank', name: 'Mercantile Bank MBank', type: 'internet', icon: '🌐', fees: '1.2%', minAmount: 50, maxAmount: 90000, processingTime: '10-20 min', isActive: true },
  { id: 'sonalibank', name: 'Sonali Bank Sonali eSheba', type: 'internet', icon: '🌐', fees: '1.5%', minAmount: 50, maxAmount: 60000, processingTime: '15-30 min', isActive: true },

  // Card Payments
  { id: 'visa', name: 'VISA', type: 'card', icon: '💳', fees: '3.5%', minAmount: 20, maxAmount: 50000, processingTime: 'Instant', isActive: true },
  { id: 'mastercard', name: 'Mastercard', type: 'card', icon: '💳', fees: '3.5%', minAmount: 20, maxAmount: 50000, processingTime: 'Instant', isActive: true },
  { id: 'amex', name: 'American Express', type: 'card', icon: '💳', fees: '3.8%', minAmount: 25, maxAmount: 40000, processingTime: 'Instant', isActive: true },
  { id: 'scb', name: 'Standard Chartered Bank', type: 'card', icon: '💳', fees: '3.2%', minAmount: 50, maxAmount: 75000, processingTime: 'Instant', isActive: true },
  { id: 'ebl', name: 'Eastern Bank Limited', type: 'card', icon: '💳', fees: '3.0%', minAmount: 30, maxAmount: 60000, processingTime: 'Instant', isActive: true },
  { id: 'citytouch', name: 'Citytouch', type: 'card', icon: '💳', fees: '2.9%', minAmount: 25, maxAmount: 65000, processingTime: 'Instant', isActive: true },

  // Agent Banking
  { id: 'islamibank_agent', name: 'Islami Bank Agent', type: 'bank', icon: '🏦', fees: '1.2%', minAmount: 50, maxAmount: 100000, processingTime: '10-30 min', isActive: true },
  { id: 'dbbl_agent', name: 'DBBL Agent Banking', type: 'bank', icon: '🏦', fees: '1.3%', minAmount: 50, maxAmount: 75000, processingTime: '10-30 min', isActive: true },
  { id: 'agrani_agent', name: 'Agrani Bank Agent', type: 'bank', icon: '🏦', fees: '1.4%', minAmount: 50, maxAmount: 50000, processingTime: '15-45 min', isActive: true },
  { id: 'sonali_agent', name: 'Sonali Bank Agent', type: 'bank', icon: '🏦', fees: '1.5%', minAmount: 50, maxAmount: 40000, processingTime: '15-45 min', isActive: true },
  { id: 'janata_agent', name: 'Janata Bank Agent', type: 'bank', icon: '🏦', fees: '1.4%', minAmount: 50, maxAmount: 45000, processingTime: '15-45 min', isActive: true },
  { id: 'brac_agent', name: 'BRAC Bank Agent', type: 'bank', icon: '🏦', fees: '1.1%', minAmount: 50, maxAmount: 80000, processingTime: '10-30 min', isActive: true },
  { id: 'mtb_agent', name: 'MTB Agent Banking', type: 'bank', icon: '🏦', fees: '1.2%', minAmount: 50, maxAmount: 70000, processingTime: '10-30 min', isActive: true },
  { id: 'ucb_agent', name: 'UCB Agent Banking', type: 'bank', icon: '🏦', fees: '1.3%', minAmount: 50, maxAmount: 65000, processingTime: '10-30 min', isActive: true },

  // International Digital Wallets & Payment Platforms
  { id: 'paypal', name: 'PayPal', type: 'mobile', icon: '💙', fees: '3.9% + $0.30', minAmount: 1, maxAmount: 10000, processingTime: 'Instant', isActive: true },
  { id: 'stripe', name: 'Stripe', type: 'card', icon: '💳', fees: '2.9% + $0.30', minAmount: 1, maxAmount: 999999, processingTime: 'Instant', isActive: true },
  { id: 'skrill', name: 'Skrill', type: 'mobile', icon: '💰', fees: '3.9%', minAmount: 10, maxAmount: 20000, processingTime: '1-3 hours', isActive: true },
  { id: 'payoneer', name: 'Payoneer', type: 'mobile', icon: '🌍', fees: '3.0%', minAmount: 25, maxAmount: 7500, processingTime: '1-2 hours', isActive: true },
  { id: 'wise', name: 'Wise (formerly TransferWise)', type: 'bank', icon: '🌐', fees: '0.5-2%', minAmount: 1, maxAmount: 100000, processingTime: '1-4 hours', isActive: true },
  { id: 'revolut', name: 'Revolut', type: 'mobile', icon: '🚀', fees: '2.5%', minAmount: 1, maxAmount: 40000, processingTime: 'Instant', isActive: true },
  { id: 'cashapp', name: 'Cash App', type: 'mobile', icon: '💚', fees: '3.0%', minAmount: 1, maxAmount: 2500, processingTime: 'Instant', isActive: true },
  { id: 'googlepay', name: 'Google Pay', type: 'mobile', icon: '🟡', fees: '2.9%', minAmount: 1, maxAmount: 5000, processingTime: 'Instant', isActive: true },
  { id: 'applepay', name: 'Apple Pay', type: 'mobile', icon: '🍎', fees: '2.9%', minAmount: 1, maxAmount: 5000, processingTime: 'Instant', isActive: true },
  { id: 'alipay', name: 'Alipay', type: 'mobile', icon: '🔵', fees: '3.5%', minAmount: 10, maxAmount: 50000, processingTime: 'Instant', isActive: true },
  { id: 'wechatpay', name: 'WeChat Pay', type: 'mobile', icon: '💬', fees: '3.5%', minAmount: 10, maxAmount: 50000, processingTime: 'Instant', isActive: true },
  { id: 'linepay', name: 'LINE Pay', type: 'mobile', icon: '💚', fees: '3.2%', minAmount: 10, maxAmount: 30000, processingTime: 'Instant', isActive: true },
  { id: 'kakaopay', name: 'Kakao Pay', type: 'mobile', icon: '🟡', fees: '3.0%', minAmount: 10, maxAmount: 25000, processingTime: 'Instant', isActive: true },
  { id: 'venmo', name: 'Venmo (by PayPal - USA)', type: 'mobile', icon: '💙', fees: '3.0%', minAmount: 1, maxAmount: 2999, processingTime: 'Instant', isActive: true },
  { id: 'zelle', name: 'Zelle (USA bank-to-bank)', type: 'bank', icon: '🏦', fees: 'Free', minAmount: 1, maxAmount: 2500, processingTime: 'Instant', isActive: true },
  { id: 'square', name: 'Square (POS + online)', type: 'card', icon: '⬜', fees: '2.6% + $0.10', minAmount: 1, maxAmount: 50000, processingTime: 'Instant', isActive: true },
  { id: 'amazonpay', name: 'Amazon Pay', type: 'mobile', icon: '📦', fees: '2.9% + $0.30', minAmount: 1, maxAmount: 50000, processingTime: 'Instant', isActive: true },
  { id: 'samsungpay', name: 'Samsung Pay', type: 'mobile', icon: '📱', fees: '2.9%', minAmount: 1, maxAmount: 5000, processingTime: 'Instant', isActive: true },
  { id: 'paysend', name: 'Paysend', type: 'mobile', icon: '💸', fees: '$1.50 + 2%', minAmount: 1, maxAmount: 15000, processingTime: '30 min', isActive: true },
  { id: 'neteller', name: 'Neteller', type: 'mobile', icon: '💳', fees: '3.9%', minAmount: 10, maxAmount: 20000, processingTime: 'Instant', isActive: true },
  { id: 'bankasia_agent', name: 'Bank Asia Agent', type: 'bank', icon: '🏦', fees: '1.2%', minAmount: 50, maxAmount: 75000, processingTime: '10-30 min', isActive: true },
  { id: 'prime_agent', name: 'Prime Bank Agent', type: 'bank', icon: '🏦', fees: '1.1%', minAmount: 50, maxAmount: 80000, processingTime: '10-30 min', isActive: true },
];

export default function DepositWithdrawalPage() {
  const { user } = useAuth();
  const { balance, currency, refetchBalance } = useWallet();
  const { currentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('deposit');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'mobile' | 'internet' | 'card' | 'bank'>('all');
  const [showKycModal, setShowKycModal] = useState(false);


  const filteredMethods = PAYMENT_METHODS.filter(method => 
    filterType === 'all' || method.type === filterType
  );

  // Debug logging
  console.log('Total payment methods:', PAYMENT_METHODS.length);
  console.log('Current filter:', filterType);
  console.log('Filtered methods count:', filteredMethods.length);
  console.log('All payment methods:', PAYMENT_METHODS.map(m => m.name));

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    // Show KYC modal when any payment method is selected
    console.log('Payment method selected:', method.name);
    setSelectedMethod(method);
    setShowKycModal(true);
    console.log('Modal state set to:', true);
  };

  const handleTransaction = async () => {

    if (!selectedMethod || !amount || !accountNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount < selectedMethod.minAmount || numAmount > selectedMethod.maxAmount) {
      toast({
        title: "Invalid Amount",
        description: `Amount must be between ${selectedMethod.minAmount} and ${selectedMethod.maxAmount} ${currency}.`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const endpoint = activeTab === 'deposit' ? '/api/wallet/deposit' : '/api/wallet/withdrawal';
      const result = await post(endpoint, {
        amount: numAmount,
        paymentMethod: selectedMethod.id,
        paymentMethodName: selectedMethod.name,
        accountNumber,
        transactionId: activeTab === 'withdrawal' ? transactionId : undefined,
      });

      toast({
        title: `${activeTab === 'deposit' ? 'Deposit' : 'Withdrawal'} Successful!`,
        description: `${numAmount} ${currency} ${activeTab === 'deposit' ? 'added to' : 'withdrawn from'} your account via ${selectedMethod.name}.`,
        duration: 5000,
      });

      // Reset form
      setAmount('');
      setAccountNumber('');
      setTransactionId('');
      setSelectedMethod(null);

      // Refresh balance
      await refetchBalance();

    } catch (error: any) {
      console.error(`${activeTab} error:`, error);
      toast({
        title: "Transaction Failed",
        description: error.message || `Failed to process ${activeTab}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'internet': return <Globe className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'bank': return <Building className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Deposit & Withdrawal</h1>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Current Balance</div>
              <div className="text-2xl font-bold">{balance} {currency}</div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deposit" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Deposit Money
              </TabsTrigger>
              <TabsTrigger value="withdrawal" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Withdraw Money
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Add Money to Your Account</CardTitle>
                  <CardDescription>
                    Choose from 52+ Bangladeshi payment methods to add funds instantly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {renderPaymentMethodSelection()}
                  {selectedMethod && renderTransactionForm()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdrawal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">Withdraw Money from Your Account</CardTitle>
                  <CardDescription>
                    Withdraw your winnings to any of your preferred payment methods
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {renderPaymentMethodSelection()}
                  {selectedMethod && renderTransactionForm()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* KYC Verification Modal */}
          {showKycModal && (
            <div 
              className="fixed inset-0 bg-black/80 flex items-start justify-center pt-8 p-4"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
            >
              <div 
                className="rounded-lg max-w-md w-full shadow-2xl relative backdrop-blur-sm border"
                style={{ 
                  backgroundColor: currentTheme.colors.card, 
                  color: currentTheme.colors.text, 
                  zIndex: 100000, 
                  marginTop: '20px',
                  borderColor: currentTheme.colors.accent + '40'
                }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-6 w-6" style={{ color: currentTheme.colors.warning }} />
                      <h2 className="text-xl font-bold" style={{ color: currentTheme.colors.text, fontSize: '20px', fontWeight: 'bold' }}>KYC Verification Required</h2>
                    </div>
                    <button 
                      onClick={() => {
                        console.log('Closing modal');
                        setShowKycModal(false);
                      }}
                      className="hover:opacity-70 transition-opacity"
                      style={{ color: currentTheme.colors.muted }}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {selectedMethod && (
                    <div className="mb-4 p-3 rounded-lg border" style={{ 
                      backgroundColor: currentTheme.colors.background, 
                      borderColor: currentTheme.colors.accent + '30' 
                    }}>
                      <p style={{ color: currentTheme.colors.text, fontSize: '14px' }}>
                        You selected <strong style={{ color: currentTheme.colors.primary, fontWeight: 'bold' }}>{selectedMethod.name}</strong> for your transaction.
                      </p>
                    </div>
                  )}
                  
                  <p className="mb-6" style={{ color: currentTheme.colors.muted, fontSize: '16px', lineHeight: '1.5' }}>
                    To ensure the security of your account and comply with regulations, you must verify your identity before using any payment methods.
                  </p>
                  
                  <div className="rounded-lg p-4 mb-6 border-2" style={{ 
                    backgroundColor: currentTheme.colors.warning + '20', 
                    borderColor: currentTheme.colors.warning + '50' 
                  }}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: currentTheme.colors.warning }} />
                      <div>
                        <h4 style={{ color: currentTheme.colors.warning, fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>Verification Required</h4>
                        <p style={{ color: currentTheme.colors.text, fontSize: '14px', lineHeight: '1.4', opacity: 0.9 }}>
                          All deposits and withdrawals are currently restricted until you complete KYC verification.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 style={{ color: currentTheme.colors.text, fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>To verify your account:</h4>
                    <ol className="space-y-3">
                      <li className="flex items-start gap-3">
                        <span className="rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mt-0.5 flex-shrink-0" style={{ 
                          backgroundColor: currentTheme.colors.primary, 
                          color: currentTheme.colors.card 
                        }}>1</span>
                        <span style={{ color: currentTheme.colors.text, fontSize: '14px', lineHeight: '1.5', opacity: 0.9 }}>Contact our support team through live chat or email</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mt-0.5 flex-shrink-0" style={{ 
                          backgroundColor: currentTheme.colors.primary, 
                          color: currentTheme.colors.card 
                        }}>2</span>
                        <span style={{ color: currentTheme.colors.text, fontSize: '14px', lineHeight: '1.5', opacity: 0.9 }}>Provide required identity documents (ID card, passport, etc.)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mt-0.5 flex-shrink-0" style={{ 
                          backgroundColor: currentTheme.colors.primary, 
                          color: currentTheme.colors.card 
                        }}>3</span>
                        <span style={{ color: currentTheme.colors.text, fontSize: '14px', lineHeight: '1.5', opacity: 0.9 }}>Wait for verification approval (usually 24-48 hours)</span>
                      </li>
                    </ol>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        window.open('https://t.me/shadowcasino_support', '_blank');
                      }}
                      className="w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium hover:opacity-90 transition-all duration-200 hover:scale-105"
                      style={{ 
                        background: currentTheme.gradients.primary, 
                        color: currentTheme.colors.card, 
                        fontSize: '16px', 
                        fontWeight: '500',
                        boxShadow: `0 4px 12px ${currentTheme.colors.primary}40`
                      }}
                    >
                      <MessageSquare className="h-4 w-4" style={{ color: currentTheme.colors.card }} />
                      Contact Support
                    </button>
                    <button
                      onClick={() => {
                        console.log('Closing modal via close button');
                        setShowKycModal(false);
                      }}
                      className="w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-80 transition-all duration-200 border-2"
                      style={{ 
                        borderColor: currentTheme.colors.accent, 
                        backgroundColor: 'transparent', 
                        color: currentTheme.colors.text, 
                        fontSize: '16px', 
                        fontWeight: '500' 
                      }}
                    >
                      <X className="h-4 w-4" style={{ color: currentTheme.colors.text }} />
                      Close
                    </button>
                  </div>

                  <div className="text-center pt-4 mt-4 border-t" style={{ 
                    borderColor: currentTheme.colors.accent + '30', 
                    color: currentTheme.colors.muted, 
                    fontSize: '12px' 
                  }}>
                    For security reasons, all payment methods require identity verification
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );

  function renderPaymentMethodSelection() {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Label>Filter by Type:</Label>
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="mobile">Mobile Banking</SelectItem>
              <SelectItem value="internet">Internet Banking</SelectItem>
              <SelectItem value="card">Cards</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMethods.map((method) => (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedMethod?.id === method.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handlePaymentMethodSelect(method)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getMethodIcon(method.type)}
                    <span className="font-semibold">{method.name}</span>
                  </div>
                  <span className="text-2xl">{method.icon}</span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Fees:</span>
                    <span className="font-medium">{method.fees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Limit:</span>
                    <span className="font-medium">{method.minAmount}-{method.maxAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span className="font-medium">{method.processingTime}</span>
                  </div>
                </div>
                <Badge variant={method.type === 'mobile' ? 'default' : method.type === 'card' ? 'secondary' : 'outline'} className="mt-2">
                  {method.type.charAt(0).toUpperCase() + method.type.slice(1)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  function renderTransactionForm() {
    if (!selectedMethod) return null;

    const fees = parseFloat(amount || '0') * (parseFloat(selectedMethod.fees.replace('%', '')) / 100);
    const totalAmount = activeTab === 'deposit' 
      ? parseFloat(amount || '0') - fees 
      : parseFloat(amount || '0') + fees;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getMethodIcon(selectedMethod.type)}
            {activeTab === 'deposit' ? 'Deposit via' : 'Withdraw to'} {selectedMethod.name}
          </CardTitle>
          <CardDescription>
            Processing time: {selectedMethod.processingTime} | Fees: {selectedMethod.fees}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount ({currency})</Label>
              <Input
                id="amount"
                type="number"
                placeholder={`Min: ${selectedMethod.minAmount}, Max: ${selectedMethod.maxAmount}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={selectedMethod.minAmount}
                max={selectedMethod.maxAmount}
              />
            </div>
            <div>
              <Label htmlFor="accountNumber">
                {selectedMethod.type === 'card' ? 'Card Number' : 'Account Number/Mobile'}
              </Label>
              <Input
                id="accountNumber"
                placeholder={
                  selectedMethod.type === 'card' 
                    ? '1234 5678 9012 3456' 
                    : selectedMethod.type === 'mobile'
                    ? '01712345678'
                    : 'Account number'
                }
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
          </div>

          {activeTab === 'withdrawal' && (
            <div>
              <Label htmlFor="transactionId">Transaction PIN/Password (Optional)</Label>
              <Input
                id="transactionId"
                type="password"
                placeholder="Enter your transaction PIN"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>
          )}

          {amount && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">{amount} {currency}</span>
              </div>
              <div className="flex justify-between">
                <span>Fees ({selectedMethod.fees}):</span>
                <span className="font-medium">{fees.toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">
                  {activeTab === 'deposit' ? 'You will receive:' : 'Total deducted:'}
                </span>
                <span className="font-bold text-primary">
                  {totalAmount.toFixed(2)} {currency}
                </span>
              </div>
            </div>
          )}

          <Button
            onClick={handleTransaction}
            disabled={isProcessing || !amount || !accountNumber}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : (
              `${activeTab === 'deposit' ? 'Deposit' : 'Withdraw'} ${amount || '0'} ${currency}`
            )}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <div>• All transactions are secured with 256-bit SSL encryption</div>
            <div>• {activeTab === 'deposit' ? 'Deposits' : 'Withdrawals'} are processed within {selectedMethod.processingTime}</div>
            <div>• Customer support available 24/7 for any transaction issues</div>
          </div>
        </CardContent>
      </Card>
    );
  }
}