import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

// Eagerly loaded — these are the entry points users hit first
import Landing from "@/pages/index";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";

// Public pages — lazy loaded
const StorePublic = lazy(() => import("@/pages/store-public"));
const ProductPublic = lazy(() => import("@/pages/product-public"));
const ProductCheckout = lazy(() => import("@/pages/product-checkout"));
const ProductAccess = lazy(() => import("@/pages/product-access"));
const CreatorProfile = lazy(() => import("@/pages/creator"));
const Pricing = lazy(() => import("@/pages/pricing"));
const Promo = lazy(() => import("@/pages/promo"));
const LegalPage = lazy(() => import("@/pages/legal-page"));

// User app pages — lazy loaded
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Create = lazy(() => import("@/pages/create"));
const VideoModel = lazy(() => import("@/pages/video-model"));
const Thumbnails = lazy(() => import("@/pages/thumbnails"));
const Pdfs = lazy(() => import("@/pages/pdfs"));
const History = lazy(() => import("@/pages/history"));
const Chat = lazy(() => import("@/pages/chat"));
const Settings = lazy(() => import("@/pages/settings"));
const LandingPageGen = lazy(() => import("@/pages/landing-page"));
const Scripts = lazy(() => import("@/pages/scripts"));
const CreateProduct = lazy(() => import("@/pages/create-product"));
const QuickLaunch = lazy(() => import("@/pages/quick-launch"));
const MyStore = lazy(() => import("@/pages/my-store"));
const Earnings = lazy(() => import("@/pages/earnings"));
const Trending = lazy(() => import("@/pages/trending"));
const EditLanding = lazy(() => import("@/pages/edit-landing"));
const Affiliate = lazy(() => import("@/pages/affiliate"));
const Automations = lazy(() => import("@/pages/automations"));
const AutomationsBuilder = lazy(() => import("@/pages/automations-builder"));
const AutomationsMarketplace = lazy(() => import("@/pages/automations-marketplace"));
const AutomationsRuns = lazy(() => import("@/pages/automations-runs"));
const VoiceStudio = lazy(() => import("@/pages/voice-studio"));
const VoiceClones = lazy(() => import("@/pages/voice-clones"));
const VideoGenerator = lazy(() => import("@/pages/video-generator"));
const ScryvoxStudio = lazy(() => import("@/pages/scryvox"));
const ScryvoxProducts = lazy(() => import("@/pages/scryvox-products"));
const ScryvoxProduct = lazy(() => import("@/pages/scryvox-product"));
const Marketplace = lazy(() => import("@/pages/marketplace"));
const MarketplaceTemplate = lazy(() => import("@/pages/marketplace-template"));
const AutomationsGenerators = lazy(() => import("@/pages/automations-generators"));
const TemplateGenerator = lazy(() => import("@/pages/template-generator"));
const MyAffiliateProgram = lazy(() => import("@/pages/my-affiliate-program"));
const MyAgents = lazy(() => import("@/pages/my-agents"));
const CustomOffer = lazy(() => import("@/pages/custom-offer"));
const AffiliatePortal = lazy(() => import("@/pages/affiliate-portal"));
const BuyerDashboard = lazy(() => import("@/pages/buyer-dashboard"));
const JoinAffiliate = lazy(() => import("@/pages/join-affiliate"));
const PromptStudio = lazy(() => import("@/pages/prompt-studio"));

// Admin pages — lazy loaded as a group
const AdminDashboard = lazy(() => import("@/pages/admin/index"));
const AdminAnalytics = lazy(() => import("@/pages/admin/analytics"));
const AdminBroadcast = lazy(() => import("@/pages/admin/broadcast"));
const AdminAffiliates = lazy(() => import("@/pages/admin/affiliates"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminPrompts = lazy(() => import("@/pages/admin/prompts"));
const AdminApiKeys = lazy(() => import("@/pages/admin/api-keys"));
const AdminPayments = lazy(() => import("@/pages/admin/payments"));
const AdminFeatures = lazy(() => import("@/pages/admin/features"));
const AdminSettings = lazy(() => import("@/pages/admin/settings"));
const AdminChat = lazy(() => import("@/pages/admin/chat"));
const AdminContent = lazy(() => import("@/pages/admin/content"));
const AdminPages = lazy(() => import("@/pages/admin/pages"));
const AdminAutomations = lazy(() => import("@/pages/admin/automations"));
const AdminProducts = lazy(() => import("@/pages/admin/products"));
const AdminEmailMarketing = lazy(() => import("@/pages/admin/email-marketing"));
const AdminRevenue = lazy(() => import("@/pages/admin/revenue"));
const AdminVoices = lazy(() => import("@/pages/admin/voices"));
const AdminScryvox = lazy(() => import("@/pages/admin/scryvox"));
const AdminScryvoxKnowledge = lazy(() => import("@/pages/admin/scryvox-knowledge"));
const AdminTemplates = lazy(() => import("@/pages/admin/templates"));
const AdminPromptPackages = lazy(() => import("@/pages/admin/prompt-packages"));
const AdminWorkspace = lazy(() => import("@/pages/admin/workspace"));
const AdminSaas = lazy(() => import("@/pages/admin/saas"));
const AdminVideoAgent = lazy(() => import("@/pages/admin/video-agent"));
const AdminMedia = lazy(() => import("@/pages/admin/media"));
const VideoAgentPage = lazy(() => import("@/pages/video-agent"));
const CreditsPage = lazy(() => import("@/pages/credits"));
const AdminCredits = lazy(() => import("@/pages/admin/credits"));
const AdminToolFlags = lazy(() => import("@/pages/admin/tool-flags"));

// Workspace (AI Dev Studio) — full-screen, no AppLayout
const WorkspaceHub = lazy(() => import("@/pages/workspace"));
const WorkspaceIDE = lazy(() => import("@/pages/workspace-ide"));
const WorkspacePreview = lazy(() => import("@/pages/workspace-preview"));

// Course Builder
const CoursesPage = lazy(() => import("@/pages/courses"));
const CourseCreate = lazy(() => import("@/pages/course-create"));
const CourseView = lazy(() => import("@/pages/course-view"));

// SaaS Builder
const SaasBuilder = lazy(() => import("@/pages/saas-builder"));
const SaasBuilderNew = lazy(() => import("@/pages/saas-builder-new"));
const SaasBuilderIDE = lazy(() => import("@/pages/saas-builder-ide"));
const SaasPublic = lazy(() => import("@/pages/saas-public"));
const SaasApp = lazy(() => import("@/pages/saas-app"));

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

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { data: user, isLoading, error } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false },
  });

  if (isLoading) return <PageLoader />;

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
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/store/:username" component={StorePublic} />
          <Route path="/creator/:username" component={CreatorProfile} />
          <Route path="/product/:id/checkout" component={ProductCheckout} />
          <Route path="/product/:id/access" component={ProductAccess} />
          <Route path="/product/:id" component={ProductPublic} />

          {/* User Routes */}
          <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
          <Route path="/create">{() => <ProtectedRoute component={Create} />}</Route>
          <Route path="/video-model">{() => <ProtectedRoute component={VideoModel} />}</Route>
          <Route path="/thumbnails">{() => <ProtectedRoute component={Thumbnails} />}</Route>
          <Route path="/pdfs">{() => <ProtectedRoute component={Pdfs} />}</Route>
          <Route path="/history">{() => <ProtectedRoute component={History} />}</Route>
          <Route path="/chat">{() => <ProtectedRoute component={Chat} />}</Route>
          <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
          <Route path="/landing-page">{() => <ProtectedRoute component={LandingPageGen} />}</Route>
          <Route path="/scripts">{() => <ProtectedRoute component={Scripts} />}</Route>
          <Route path="/pricing" component={Pricing} />
          <Route path="/quick-launch">{() => <ProtectedRoute component={QuickLaunch} />}</Route>
          <Route path="/prompt-studio">{() => <ProtectedRoute component={PromptStudio} />}</Route>
          <Route path="/create-product">{() => <ProtectedRoute component={CreateProduct} />}</Route>
          <Route path="/my-store">{() => <ProtectedRoute component={MyStore} />}</Route>
          <Route path="/earnings">{() => <ProtectedRoute component={Earnings} />}</Route>
          <Route path="/trending">{() => <ProtectedRoute component={Trending} />}</Route>
          <Route path="/edit-landing">{() => <ProtectedRoute component={EditLanding} />}</Route>
          <Route path="/affiliate">{() => <ProtectedRoute component={Affiliate} />}</Route>
          <Route path="/automations">{() => <ProtectedRoute component={Automations} />}</Route>
          <Route path="/automations/builder">{() => <ProtectedRoute component={AutomationsBuilder} />}</Route>
          <Route path="/automations/marketplace">{() => <ProtectedRoute component={AutomationsMarketplace} />}</Route>
          <Route path="/automations/runs">{() => <ProtectedRoute component={AutomationsRuns} />}</Route>
          <Route path="/voice">{() => <ProtectedRoute component={VoiceStudio} />}</Route>
          <Route path="/voice/clones">{() => <ProtectedRoute component={VoiceClones} />}</Route>
          <Route path="/video-generator">{() => <ProtectedRoute component={VideoGenerator} />}</Route>
          <Route path="/scryvox">{() => <ProtectedRoute component={ScryvoxStudio} />}</Route>
          <Route path="/scryvox/products">{() => <ProtectedRoute component={ScryvoxProducts} />}</Route>
          <Route path="/scryvox/products/:id">{() => <ProtectedRoute component={ScryvoxProduct} />}</Route>
          <Route path="/courses/create">{() => <ProtectedRoute component={CourseCreate} />}</Route>
          <Route path="/courses/:id">{() => <ProtectedRoute component={CourseView} />}</Route>
          <Route path="/courses">{() => <ProtectedRoute component={CoursesPage} />}</Route>
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/marketplace/template/:id" component={MarketplaceTemplate} />
          <Route path="/automations/generators">{() => <ProtectedRoute component={AutomationsGenerators} />}</Route>
          <Route path="/automations/generators/:type">{() => <ProtectedRoute component={TemplateGenerator} />}</Route>
          <Route path="/my-affiliate-program">{() => <ProtectedRoute component={MyAffiliateProgram} />}</Route>
          <Route path="/my-agents">{() => <ProtectedRoute component={MyAgents} />}</Route>
          <Route path="/marketplace/custom-offer" component={CustomOffer} />
          <Route path="/affiliate-portal">{() => <ProtectedRoute component={AffiliatePortal} />}</Route>
          <Route path="/my-purchases">{() => <ProtectedRoute component={BuyerDashboard} />}</Route>
          <Route path="/join-affiliate/:code" component={JoinAffiliate} />

          {/* Public Marketing & Legal */}
          <Route path="/promo" component={Promo} />
          <Route path="/about">{() => <LegalPage />}</Route>
          <Route path="/privacy-policy">{() => <LegalPage />}</Route>
          <Route path="/terms">{() => <LegalPage />}</Route>
          <Route path="/refund-policy">{() => <LegalPage />}</Route>

          {/* Admin Routes */}
          <Route path="/admin">{() => <ProtectedRoute component={AdminDashboard} adminOnly />}</Route>
          <Route path="/admin/analytics">{() => <ProtectedRoute component={AdminAnalytics} adminOnly />}</Route>
          <Route path="/admin/broadcast">{() => <ProtectedRoute component={AdminBroadcast} adminOnly />}</Route>
          <Route path="/admin/affiliates">{() => <ProtectedRoute component={AdminAffiliates} adminOnly />}</Route>
          <Route path="/admin/users">{() => <ProtectedRoute component={AdminUsers} adminOnly />}</Route>
          <Route path="/admin/prompts">{() => <ProtectedRoute component={AdminPrompts} adminOnly />}</Route>
          <Route path="/admin/api-keys">{() => <ProtectedRoute component={AdminApiKeys} adminOnly />}</Route>
          <Route path="/admin/payments">{() => <ProtectedRoute component={AdminPayments} adminOnly />}</Route>
          <Route path="/admin/features">{() => <ProtectedRoute component={AdminFeatures} adminOnly />}</Route>
          <Route path="/admin/settings">{() => <ProtectedRoute component={AdminSettings} adminOnly />}</Route>
          <Route path="/admin/chat">{() => <ProtectedRoute component={AdminChat} adminOnly />}</Route>
          <Route path="/admin/content">{() => <ProtectedRoute component={AdminContent} adminOnly />}</Route>
          <Route path="/admin/pages">{() => <ProtectedRoute component={AdminPages} adminOnly />}</Route>
          <Route path="/admin/automations">{() => <ProtectedRoute component={AdminAutomations} adminOnly />}</Route>
          <Route path="/admin/products">{() => <ProtectedRoute component={AdminProducts} adminOnly />}</Route>
          <Route path="/admin/email-marketing">{() => <ProtectedRoute component={AdminEmailMarketing} adminOnly />}</Route>
          <Route path="/admin/revenue">{() => <ProtectedRoute component={AdminRevenue} adminOnly />}</Route>
          <Route path="/admin/voices">{() => <ProtectedRoute component={AdminVoices} adminOnly />}</Route>
          <Route path="/admin/scryvox">{() => <ProtectedRoute component={AdminScryvox} adminOnly />}</Route>
          <Route path="/admin/scryvox/knowledge">{() => <ProtectedRoute component={AdminScryvoxKnowledge} adminOnly />}</Route>
          <Route path="/admin/templates">{() => <ProtectedRoute component={AdminTemplates} adminOnly />}</Route>
          <Route path="/admin/prompt-packages">{() => <ProtectedRoute component={AdminPromptPackages} adminOnly />}</Route>
          <Route path="/admin/workspace">{() => <ProtectedRoute component={AdminWorkspace} adminOnly />}</Route>
          <Route path="/admin/saas">{() => <ProtectedRoute component={AdminSaas} adminOnly />}</Route>
          <Route path="/admin/video-agent">{() => <ProtectedRoute component={AdminVideoAgent} adminOnly />}</Route>
          <Route path="/admin/media">{() => <ProtectedRoute component={AdminMedia} adminOnly />}</Route>
          <Route path="/admin/credits">{() => <ProtectedRoute component={AdminCredits} adminOnly />}</Route>
          <Route path="/admin/tools">{() => <ProtectedRoute component={AdminToolFlags} adminOnly />}</Route>

          {/* Credits */}
          <Route path="/credits">{() => <ProtectedRoute component={CreditsPage} />}</Route>

          {/* Video Agent — user studio */}
          <Route path="/video-agent">{() => <ProtectedRoute component={VideoAgentPage} />}</Route>

          {/* Public project preview — no auth required */}
          <Route path="/preview/:token" component={WorkspacePreview} />

          {/* AI Dev Studio — full-screen, rendered inside AppLayout */}
          <Route path="/workspace/:id">{() => <ProtectedRoute component={WorkspaceIDE} />}</Route>
          <Route path="/workspace">{() => <ProtectedRoute component={WorkspaceHub} />}</Route>

          {/* SaaS Builder — creator routes (protected) */}
          <Route path="/saas-builder/new">{() => <ProtectedRoute component={SaasBuilderNew} />}</Route>
          <Route path="/saas-builder/:id">{() => <ProtectedRoute component={SaasBuilderIDE} />}</Route>
          <Route path="/saas-builder">{() => <ProtectedRoute component={SaasBuilder} />}</Route>

          {/* SaaS Public Pages — no auth, full-screen */}
          <Route path="/saas/:slug/app" component={SaasApp} />
          <Route path="/saas/:slug" component={SaasPublic} />

          <Route component={NotFound} />
        </Switch>
      </Suspense>
      <ChatbotWidget />
    </>
  );
}

function AppInner() {
  const { data } = useQuery({
    queryKey: ["google-client-id"],
    queryFn: () =>
      fetch("/api/auth/google-config")
        .then((r) => r.json())
        .then((d) => (d.clientId as string | null) ?? null),
    staleTime: 60_000,
    retry: false,
  });

  const googleClientId =
    data ?? (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? null;

  const content = (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );

  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>;
  }
  return content;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}

export default App;
