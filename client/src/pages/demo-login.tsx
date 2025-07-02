import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function DemoLogin() {
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ username, password });
      navigate("/");
    } catch (err) {
      setError(typeof err === "string" ? err : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1a1a2e] rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Project Shadow <span className="text-[#7c3aed]">Casino</span>
          </h1>
          <p className="text-gray-400 mt-2">Demo Login</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-[#07070e] border border-[#2d2d4a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                placeholder="Enter username"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-[#07070e] border border-[#2d2d4a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                placeholder="Enter password"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#7c3aed] text-white py-3 rounded-md font-medium hover:bg-[#6d28d9] transition duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            For demo purposes, use:
          </p>
          <p className="text-white text-sm mt-1">
            Username: <span className="font-medium">demo</span> | Password: <span className="font-medium">demo</span>
          </p>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <h3 className="text-yellow-500 font-medium mb-1">Demo Mode</h3>
          <p className="text-sm text-gray-300">
            This login page is configured to work with a special demo user that bypasses normal authentication.
          </p>
        </div>
      </div>
    </div>
  );
}