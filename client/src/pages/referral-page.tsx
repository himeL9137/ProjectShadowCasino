import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Gift, Users, DollarSign, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MainLayout } from "@/components/layout/MainLayout";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
}

interface Referral {
  id: number;
  referrerId: number;
  refereeId: number;
  referralCode: string;
  bonusAmount: string;
  commissionRate: number;
  status: string;
  firstDepositDate: string | null;
  totalEarnings: string;
  createdAt: string;
}

interface ReferralSettings {
  id: number;
  signupBonus: string;
  commissionRate: number;
  minimumDeposit: string;
  maxCommissionPerUser: string;
  maxReferralsPerUser: number;
  isActive: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  balance: string;
  currency: string;
  role: string;
  referralCode: string | null;
  referredBy: number | null;
  totalReferrals: number;
  referralEarnings: string;
}

export function ReferralPage() {
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user's referral data
  const { data: referrals = [], isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ["/api/referrals/my-referrals"],
  });

  const { data: settings } = useQuery<ReferralSettings>({
    queryKey: ["/api/referrals/settings"],
  });

  // Generate referral code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/referrals/generate-code");
      await throwIfResNotOk(response);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Referral Code Generated",
        description: `Your referral code is: ${data.referralCode}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate referral code",
        variant: "destructive",
      });
    },
  });

  // Use referral code mutation
  const useCodeMutation = useMutation({
    mutationFn: async (referralCode: string) => {
      const response = await apiRequest("POST", "/api/referrals/use-code", { referralCode });
      await throwIfResNotOk(response);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: data.message || "Referral code applied successfully! Both you and your referrer have received 30 BDT bonus.",
      });
      setReferralCodeInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/my-referrals"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to apply referral code",
        variant: "destructive",
      });
    },
  });

  // Get current user data for referral code
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  const totalEarnings = referrals.reduce((sum, ref) => sum + parseFloat(ref.totalEarnings || "0"), 0);
  const activeReferrals = referrals.filter(ref => ref.status === "active" || ref.status === "rewarded").length;
  const rewardedReferrals = referrals.filter(ref => ref.status === "rewarded").length;
  const maxEarningReferrals = settings?.maxReferralsPerUser || 3;
  const canStillEarn = rewardedReferrals < maxEarningReferrals;
  const remainingEarningSlots = maxEarningReferrals - rewardedReferrals;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Referral Program
          </h1>
          <p className="text-muted-foreground">
            Refer friends and both get {settings?.signupBonus || "30"} {user?.currency || 'BDT'} instantly! You can invite up to {settings?.maxReferralsPerUser || 3} people.
          </p>
        </div>

        {/* Program Benefits */}
        <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              Program Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold">Instant Bonus</h3>
              <p className="text-sm text-muted-foreground">
                Earn {settings?.signupBonus || "30"} {user?.currency || 'BDT'} for your first {maxEarningReferrals} successful referrals
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="h-12 w-12 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold">Build Your Network</h3>
              <p className="text-sm text-muted-foreground">
                Continue referring friends even after earning limit - help them get bonuses!
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="h-12 w-12 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold">Premium Rewards</h3>
              <p className="text-sm text-muted-foreground">
                {canStillEarn ? `${remainingEarningSlots} slots remaining` : "All reward slots used"} for bonus earnings
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {totalEarnings.toFixed(2)} {user?.currency || 'BDT'}
                </div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{activeReferrals}</div>
                <p className="text-sm text-muted-foreground">Active Referrals</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{rewardedReferrals}/{maxEarningReferrals}</div>
                <p className="text-sm text-muted-foreground">Rewarded Referrals</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Referral Code */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referral Code</CardTitle>
            <CardDescription>
              Share this code with friends to help them get started and earn bonuses!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.referralCode ? (
              <div className="flex items-center gap-3">
                <Input
                  value={user.referralCode}
                  readOnly
                  className="font-mono text-lg font-bold text-center bg-background-light"
                />
                <Button
                  onClick={() => copyToClipboard(user.referralCode!)}
                  variant="outline"
                  size="icon"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">You don't have a referral code yet.</p>
                <Button
                  onClick={() => generateCodeMutation.mutate()}
                  disabled={generateCodeMutation.isPending}
                >
                  {generateCodeMutation.isPending ? "Generating..." : "Generate Referral Code"}
                </Button>
              </div>
            )}
            
            {user?.referralCode && (
              <div className="space-y-2">
                <Label>Share your referral link:</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={`${window.location.origin}/signup?ref=${user.referralCode}`}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    onClick={() => copyToClipboard(`${window.location.origin}/signup?ref=${user.referralCode}`)}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Use Referral Code */}
        <Card>
          <CardHeader>
            <CardTitle>Have a Referral Code?</CardTitle>
            <CardDescription>
              Enter a friend's referral code and both of you get {settings?.signupBonus || "30"} {user?.currency || 'BDT'} instantly!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="referralCode">Referral Code</Label>
              <Input
                id="referralCode"
                value={referralCodeInput}
                onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter referral code"
                className="font-mono"
              />
            </div>
            <Button
              onClick={() => useCodeMutation.mutate(referralCodeInput)}
              disabled={!referralCodeInput || useCodeMutation.isPending}
              className="w-full"
            >
              {useCodeMutation.isPending ? "Applying..." : "Apply Referral Code"}
            </Button>
            {user?.referredBy && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✓ You've already used a referral code and helped a friend earn bonus credits!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral History */}
        {referrals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Referrals</CardTitle>
              <CardDescription>
                Track your referral history and earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">Referral #{referral.id}</div>
                      <div className="text-sm text-muted-foreground">
                        Code: {referral.referralCode}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge
                        variant={
                          referral.status === "rewarded" ? "default" :
                          referral.status === "active" ? "secondary" : "outline"
                        }
                      >
                        {referral.status}
                      </Badge>
                      <div className="text-sm font-medium">
                        +{parseFloat(referral.totalEarnings || "0").toFixed(2)} {user?.currency || 'BDT'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}