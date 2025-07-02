import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path: string;
  component: () => React.JSX.Element;
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  console.log(`Protected route "${path}", user:`, user, "isLoading:", isLoading);

  return (
    <Route
      path={path}
      component={() => {
        // Show loading spinner while checking auth
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // Redirect to auth page if not authenticated
        if (!user) {
          return <Redirect to="/auth" />;
        }

        // If authenticated, render the protected component
        return <Component />;
      }}
    />
  );
}

export function AdminProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  console.log(`Admin protected route "${path}", user:`, user, "isLoading:", isLoading);

  return (
    <Route
      path={path}
      component={() => {
        // Show loading spinner while checking auth
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // Redirect to auth page if not authenticated
        if (!user) {
          return <Redirect to="/auth" />;
        }
        
        // Redirect if authenticated but not an admin
        if (user.role !== "admin") {
          console.log("User is not admin, redirecting to home");
          return <Redirect to="/" />;
        }
        
        // Specific check for admin users
        const isAdminUser = ["shadowHimel", "Albab AJ", "Aj Albab", "shadowHimel2"].includes(user.username);
        if (!isAdminUser) {
          console.log("User is not in authorized admin list, redirecting to home");
          return <Redirect to="/" />;
        }

        // If authenticated and admin, render the protected component
        console.log("User is authorized admin, rendering component");
        return <Component />;
      }}
    />
  );
}