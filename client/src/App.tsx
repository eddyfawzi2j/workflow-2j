import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/auth-context";
import { RequestProvider } from "@/context/request-context";
import { ProtectedRoute } from "@/lib/protected-route";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import MyRequests from "@/pages/my-requests";
import ToApprove from "@/pages/to-approve";
import Documents from "@/pages/documents";
import BesoinPage from "@/pages/besoin-page";
import Settings from "@/pages/settings";
import Users from "@/pages/users";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/my-requests" component={MyRequests} />
      <ProtectedRoute path="/to-approve" component={ToApprove} />
      <ProtectedRoute path="/documents" component={Documents} />
      <ProtectedRoute path="/besoin" component={BesoinPage} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/users" component={Users} />
      <Route path="/auth" component={AuthPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RequestProvider>
          <Router />
          <Toaster />
        </RequestProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
