import { useEffect } from "react";

export function DefaultAdvertisement() {
  useEffect(() => {
    // This script creates the atOptions variable and loads the ad script
    const script = document.createElement('script');
    script.innerHTML = `
      var atOptions = { 
        'key' : 'a1234567890abcdef1234567890abcdef', 
        'format' : 'iframe', 
        'height' : 300, 
        'width' : 160, 
        'params' : {} 
      };
    `;
    document.body.appendChild(script);
    
    // This script loads the actual ad content
    const adScript = document.createElement('script');
    adScript.src = 'http://www.example-ad-network.com/a/display.js';
    adScript.async = true;
    document.body.appendChild(adScript);
    
    return () => {
      // Cleanup when component unmounts
      document.body.removeChild(script);
      if (document.body.contains(adScript)) {
        document.body.removeChild(adScript);
      }
    };
  }, []);
  
  return (
    <div className="fixed bottom-0 left-0 z-30">
      {/* The ad will be inserted by the script */}
      <div id="ad-container" style={{ width: '160px', height: '300px' }}></div>
    </div>
  );
}