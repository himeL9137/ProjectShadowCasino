import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AdvertisementProps {
  onClose: () => void;
}

interface Ad {
  id: number;
  script: string;
  createdAt: string;
}

export function Advertisement({ onClose }: AdvertisementProps) {
  const [adHtml, setAdHtml] = useState<string>("");
  
  const { data: ad, isLoading, error } = useQuery<Ad>({
    queryKey: ["/api/advertisements/random"],
    retry: false
  });

  useEffect(() => {
    if (ad?.script) {
      setAdHtml(ad.script);
    }
  }, [ad]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-background-light w-full max-w-lg rounded-xl shadow-lg p-6 mx-4 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ad) {
    return null; // Don't show anything if there's an error or no ads
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-background-light w-full max-w-lg rounded-xl shadow-lg p-6 mx-4 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-20"
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="mt-4 relative z-10">
          {/* This uses dangerouslySetInnerHTML but it's required for ad scripts */}
          <div dangerouslySetInnerHTML={{ __html: adHtml }} />
        </div>
        
        <div className="mt-4 text-xs text-gray-400 text-center">
          Advertisement will close automatically in 30 seconds
        </div>
      </div>
    </div>
  );
}
