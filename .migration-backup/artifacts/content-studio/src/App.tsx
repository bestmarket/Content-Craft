import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

// Pages
import Landing from "@/pages/index";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Create from "@/pages/create";
import VideoModel from "@/pages/video-model";
import Thumbnails from "@/pages/thumbnails";
import Pdfs from "@/pages/pdfs";
import History from "@/pages/history";
import Chat from "@/pages/chat";
import Settings from "@/pages/settings";

// Admin pages
import AdminDashboard from "@/pages/admin/index";
import AdminUsers from "@/pages/admin/users";
import AdminPrompts from "@/pages/admin/prompts";
import AdminApiKeys from "@/pages/admin/api-keys";
import AdminPayments from "@/pages/admin/payments";
import AdminFeatures from "@/pages/admin/features";
import AdminSettings from "@/pages/admin/settings";
import AdminChat from "@/pages/admin/chat";
import AdminContent from "@/pages/admin/content";

// Layouts
import AppLayout from "@/components/layout/AppLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import ChatbotWidget from "@/components/ChatbotWidget";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) return false;
        return failureCount < 1;
      },
    },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { data: user, isLoading, error } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !user) return <Redirect to="/login" />;
  if (adminOnly && (user as any).role !== "admin") return <Redirect to="/dashboard" />;

  if (adminOnly) {
    return <AdminLayout><Component /></AdminLayout>;
  }

  return <AppLayout><Component /></AppLayout>;
}

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />

        {/* User Routes */}
        <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
        <Route path="/create">{() => <ProtectedRoute component={Create} />}</Route>
        <Route path="/video-model">{() => <ProtectedRoute component={VideoModel} />}</Route>
        <Route path="/thumbnails">{() => <ProtectedRoute component={Thumbnails} />}</Route>
        <Route path="/pdfs">{() => <ProtectedRoute component={Pdfs} />}</Route>
        <Route path="/history">{() => <ProtectedRoute component={History} />}</Route>
        <Route path="/chat">{() => <ProtectedRoute component={Chat} />}</Route>
        <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>

        {/* Admin Routes */}
        <Route path="/admin">{() => <ProtectedRoute component={AdminDashboard} adminOnly />}</Route>
        <Route path="/admin/users">{() => <ProtectedRoute component={AdminUsers} adminOnly />}</Route>
        <Route path="/admin/prompts">{() => <ProtectedRoute component={AdminPrompts} adminOnly />}</Route>
        <Route path="/admin/api-keys">{() => <ProtectedRoute component={AdminApiKeys} adminOnly />}</Route>
        <Route path="/admin/payments">{() => <ProtectedRoute component={AdminPayments} adminOnly />}</Route>
        <Route path="/admin/features">{() => <ProtectedRoute component={AdminFeatures} adminOnly />}</Route>
        <Route path="/admin/settings">{() => <ProtectedRoute component={AdminSettings} adminOnly />}</Route>
        <Route path="/admin/chat">{() => <ProtectedRoute component={AdminChat} adminOnly />}</Route>
        <Route path="/admin/content">{() => <ProtectedRoute component={AdminContent} adminOnly />}</Route>

        <Route component={NotFound} />
      </Switch>
      <ChatbotWidget />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
