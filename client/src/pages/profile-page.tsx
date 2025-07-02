import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  User, Mail, Phone, Shield, Calendar, Edit2, Save, AlertCircle, 
  Camera, Upload, X, Check, DollarSign, TrendingUp, Trophy, 
  Users, Gift, Gamepad2, Clock, MapPin, Star, Settings
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCurrency } from "@/hooks/use-currency";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currencySymbol } = useCurrency();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Form state - Initialize with actual user data
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
  });

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  // Fetch current profile picture
  const { data: profileData, refetch: refetchProfilePicture } = useQuery({
    queryKey: ['/api/profile/picture-url'],
    enabled: !!user,
    staleTime: 0,
    cacheTime: 0
  });

  // Fetch user profile statistics
  const { data: profileStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/user/profile-stats'],
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Profile picture upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await fetch('/api/profile/upload-picture', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload profile picture');
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchProfilePicture();
      queryClient.invalidateQueries({ queryKey: ['/api/profile/picture-url'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setPreviewImage(null);
      refreshUser();
      
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Profile picture delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/profile/delete-picture', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete profile picture');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/picture-url'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      refreshUser();
      toast({
        title: "Profile Picture Removed",
        description: "Your profile picture has been removed"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // File upload handlers
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, or WebP)';
    }
    
    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }
    
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({
        title: "Invalid File",
        description: error,
        variant: "destructive"
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadMutation.mutate(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    // Basic email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      
      setSuccess("Profile updated successfully");
      setIsEditing(false);
      setFormData(prev => ({
        ...prev,
        email: user?.email || "",
        phone: user?.phone || "",
      }));
      
      // Refresh user data
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile-stats'] });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      
      toast({
        title: "Update Failed",
        description: err instanceof Error ? err.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${currencySymbol}${num.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };
  
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center lg:text-left"
          >
            <h1 className="text-4xl font-bold text-foreground mb-4">Profile Settings</h1>
            <p className="text-lg text-muted-foreground">Manage your account information and preferences</p>
          </motion.div>

          <div className="flex items-center justify-between bg-card rounded-xl border shadow-sm p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Account Overview</h2>
                <p className="text-muted-foreground">Welcome back, {user?.username}</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2 px-6 py-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors"
            >
              {isEditing ? (
                <>
                  <X className="h-5 w-5" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Edit2 className="h-5 w-5" />
                  <span>Edit Profile</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-8"
          >
            {/* Profile Card */}
            <div className="bg-card rounded-xl border shadow-sm p-8">
              <h3 className="text-xl font-semibold mb-6 text-center">Profile Picture</h3>
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-6">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center border-4 border-primary/30 shadow-lg">
                    {previewImage ? (
                      <img 
                        src={previewImage} 
                        alt="Profile Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : profileData?.profilePictureUrl && profileData.profilePictureUrl !== '/assets/default-avatar.svg' ? (
                      <img 
                        src={`${profileData.profilePictureUrl}?t=${Date.now()}`} 
                        alt="Profile Picture" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Failed to load profile picture:', profileData.profilePictureUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary">
                        {user?.username?.charAt(0).toUpperCase()}
                      </span>
                    )}
                    
                    {/* Upload Progress Overlay */}
                    {uploadMutation.isPending && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                        <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Camera Icon Overlay */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors shadow-lg"
                    disabled={uploadMutation.isPending}
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                </div>
                
                <div className="text-center">
                  <h2 className="text-xl font-bold">{user?.username}</h2>
                  <div className="flex items-center justify-center mt-2 space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground capitalize">{user?.role || "User"}</span>
                    
                    {user?.isMuted && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-500 rounded-full">
                        Muted
                      </span>
                    )}
                    
                    {user?.isBanned && (
                      <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-500 rounded-full">
                        Banned
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Picture Upload Area */}
              <div className="mt-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ${
                    isDragging 
                      ? 'border-primary bg-primary/5 scale-105' 
                      : 'border-border hover:border-primary/50 hover:bg-primary/5'
                  } ${uploadMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        {isDragging ? 'Drop image here' : 'Upload Photo'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Drag and drop or{' '}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-primary hover:underline"
                          disabled={uploadMutation.isPending}
                        >
                          browse
                        </button>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, WebP • Max 5MB
                      </p>
                    </div>
                    
                    {uploadMutation.isPending && (
                      <div className="flex items-center space-x-2 text-primary">
                        <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full"></div>
                        <span className="text-xs">Uploading...</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Remove Photo Button */}
                {profileData?.profilePictureUrl && profileData.profilePictureUrl !== '/assets/default-avatar.svg' && (
                  <button
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="w-full mt-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {deleteMutation.isPending ? (
                      <div className="animate-spin h-3 w-3 border border-red-400 border-t-transparent rounded-full"></div>
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Quick Stats */}
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold mb-6 flex items-center">
                <Trophy className="h-5 w-5 text-primary mr-2" />
                Quick Stats
              </h3>
              {statsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-muted rounded h-4 w-3/4 mb-2"></div>
                      <div className="bg-muted rounded h-3 w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground text-sm">Total Games</span>
                    <span className="font-semibold text-foreground">{profileStats?.totalGames || 0}</span>
                  </div>
                  <div className="border-t border-border/50 pt-2"></div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground text-sm">Win Rate</span>
                    <span className="font-semibold text-foreground">{profileStats?.winRate || '0.0'}%</span>
                  </div>
                  <div className="border-t border-border/50 pt-2"></div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground text-sm">Total Bets</span>
                    <span className="font-semibold text-foreground">{formatCurrency(profileStats?.totalBets || '0')}</span>
                  </div>
                  <div className="border-t border-border/50 pt-2"></div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground text-sm">Total Wins</span>
                    <span className="font-semibold text-green-500">{formatCurrency(profileStats?.totalWins || '0')}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column - Account Information & Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Account Information */}
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <User className="h-5 w-5 text-primary mr-2" />
                Account Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 p-3 rounded-lg bg-background/50">
                    <div className="flex-shrink-0">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Username</p>
                      <p className="font-medium text-foreground truncate">{user?.username || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-3 rounded-lg bg-background/50">
                    <div className="flex-shrink-0">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p className="font-medium text-foreground truncate">{user?.email || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-3 rounded-lg bg-background/50">
                    <div className="flex-shrink-0">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Phone</p>
                      <p className="font-medium text-foreground truncate">{user?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-4 p-3 rounded-lg bg-background/50">
                    <div className="flex-shrink-0">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                      <p className="font-medium text-foreground">{formatDate(profileStats?.memberSince)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-3 rounded-lg bg-background/50">
                    <div className="flex-shrink-0">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Last Login</p>
                      <p className="font-medium text-foreground">{formatDate(profileStats?.lastLogin)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-3 rounded-lg bg-background/50">
                    <div className="flex-shrink-0">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Account Status</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {user?.isBanned ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-red-500/20 text-red-500 rounded-full">
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-green-500/20 text-green-500 rounded-full">
                            Active
                          </span>
                        )}
                        {user?.isMuted && (
                          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-500 rounded-full">
                            Muted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-3 bg-blue-500/10 rounded-xl">
                    <DollarSign className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Total Deposits</p>
                    <p className="text-lg font-bold text-foreground leading-tight">
                      {formatCurrency(profileStats?.totalDeposits || '0')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-3 bg-green-500/10 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Total Wins</p>
                    <p className="text-lg font-bold text-green-500 leading-tight">
                      {formatCurrency(profileStats?.totalWins || '0')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-3 bg-purple-500/10 rounded-xl">
                    <Gamepad2 className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Games Played</p>
                    <p className="text-lg font-bold text-foreground leading-tight">
                      {profileStats?.totalGames || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-3 bg-orange-500/10 rounded-xl">
                    <Gift className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Referrals</p>
                    <p className="text-lg font-bold text-foreground leading-tight">
                      {profileStats?.totalReferrals || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profileStats?.rewardedReferrals || 0} earned rewards
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Profile Form */}
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold mb-6 flex items-center">
                  <Settings className="h-5 w-5 text-primary mr-2" />
                  Edit Profile
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                        placeholder="Enter your email address"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  

                  
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center space-x-3">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                  
                  {success && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl flex items-center space-x-3">
                      <Check className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{success}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors border border-border rounded-xl hover:bg-muted/50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-primary-foreground rounded-full"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Security Tips */}
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold mb-6 flex items-center">
                <Shield className="h-5 w-5 text-primary mr-2" />
                Security Tips
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Strong Password</p>
                      <p className="text-xs text-muted-foreground mt-1">Use a unique password with letters, numbers, and symbols</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Regular Updates</p>
                      <p className="text-xs text-muted-foreground mt-1">Change your password regularly for better security</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Keep Private</p>
                      <p className="text-xs text-muted-foreground mt-1">Never share your login credentials with anyone</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Secure Logout</p>
                      <p className="text-xs text-muted-foreground mt-1">Always log out when using shared or public computers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}