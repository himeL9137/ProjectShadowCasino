import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface Ad {
  id: number;
  html: string;
  frequency: number;
  isEnabled: boolean;
  isDefault: boolean;
  createdAt: string;
}

export function PermanentAdvertisement() {
  const { user } = useAuth();
  const [adHtml, setAdHtml] = useState<string>("");
  
  const { data: ad, isLoading } = useQuery<Ad>({
    queryKey: ["/api/advertisements/default"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
  });

  useEffect(() => {
    if (ad?.html && ad.isEnabled) {
      setAdHtml(ad.html);
    } else {
      setAdHtml("");
    }
  }, [ad]);

  // Don't show ads to unauthenticated users
  if (!user) {
    return null;
  }

  // Don't show ads to admin users
  if (user?.role === 'admin' || ['shadowHimel', 'shadowTalha', 'shadowKaran'].includes(user?.username || '')) {
    return null;
  }

  if (isLoading || !ad || !ad.isEnabled || !ad.isDefault) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 z-30">
      {/* This uses dangerouslySetInnerHTML but it's required for ad scripts */}
      <div dangerouslySetInnerHTML={{ __html: adHtml }} />
    </div>
  );
}