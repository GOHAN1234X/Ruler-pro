import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminResellers from "@/pages/admin/resellers";
import AdminKeys from "@/pages/admin/keys";
import AdminSettings from "@/pages/admin/settings";
import ResellerDashboard from "@/pages/reseller/dashboard";
import ResellerKeys from "@/pages/reseller/keys";
import ResellerHistory from "@/pages/reseller/history";
import ResellerAccount from "@/pages/reseller/account";
import { useRequireAuth, useRedirectIfAuthenticated } from "./lib/auth";

// Auth-protected route component
function ProtectedRoute({ component: Component, role, ...rest }: { component: React.ComponentType, role?: 'admin' | 'reseller' }) {
  const { isLoading } = useRequireAuth(role);
  
  if (isLoading) {
    return null; // Or a loading spinner
  }
  
  return <Component {...rest} />;
}

// Redirect to dashboard if already logged in
function RedirectIfAuthenticated({ component: Component, ...rest }: { component: React.ComponentType }) {
  const { isLoading } = useRedirectIfAuthenticated();
  
  if (isLoading) {
    return null; // Or a loading spinner
  }
  
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      {/* Public pages */}
      <Route path="/" component={() => <RedirectIfAuthenticated component={Login} />} />
      
      {/* Admin routes */}
      <Route path="/admin/dashboard" component={() => <ProtectedRoute component={AdminDashboard} role="admin" />} />
      <Route path="/admin/resellers" component={() => <ProtectedRoute component={AdminResellers} role="admin" />} />
      <Route path="/admin/keys" component={() => <ProtectedRoute component={AdminKeys} role="admin" />} />
      <Route path="/admin/settings" component={() => <ProtectedRoute component={AdminSettings} role="admin" />} />
      
      {/* Reseller routes */}
      <Route path="/reseller/dashboard" component={() => <ProtectedRoute component={ResellerDashboard} role="reseller" />} />
      <Route path="/reseller/keys" component={() => <ProtectedRoute component={ResellerKeys} role="reseller" />} />
      <Route path="/reseller/history" component={() => <ProtectedRoute component={ResellerHistory} role="reseller" />} />
      <Route path="/reseller/account" component={() => <ProtectedRoute component={ResellerAccount} role="reseller" />} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
