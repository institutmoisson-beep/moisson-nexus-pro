import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { lazy, Suspense, Component, ReactNode } from "react";
import InstallPWA from "@/components/InstallPWA";

// ── Lazy loading de toutes les pages ─────────────────────────────────────────
const Index             = lazy(() => import("./pages/Index"));
const Login             = lazy(() => import("./pages/Login"));
const Register          = lazy(() => import("./pages/Register"));
const Dashboard         = lazy(() => import("./pages/Dashboard"));
const Wallet            = lazy(() => import("./pages/Wallet"));
const Packs             = lazy(() => import("./pages/Packs"));
const PackDetail        = lazy(() => import("./pages/PackDetail"));
const Orders            = lazy(() => import("./pages/Orders"));
const Network           = lazy(() => import("./pages/Network"));
const Profile           = lazy(() => import("./pages/Profile"));
const Partners          = lazy(() => import("./pages/Partners"));
const AdminDashboard    = lazy(() => import("./pages/AdminDashboard"));
const MoissonneursPros  = lazy(() => import("./pages/MoissonneursPros"));
const Stand             = lazy(() => import("./pages/Stand"));
const MSNWallet         = lazy(() => import("./pages/MSNWallet"));
const MandateMarketplace = lazy(() => import("./pages/MandateMarketplace"));
const MoissonneurPays   = lazy(() => import("./pages/MoissonneurPays"));
const MoissonneurVille  = lazy(() => import("./pages/MoissonneurVille"));
const PorteurAffaires   = lazy(() => import("./pages/PorteurAffaires"));
const UrgentCases       = lazy(() => import("./pages/UrgentCases"));
const ZoneUrgentCases   = lazy(() => import("./pages/ZoneUrgentCases"));
const CommunityFund     = lazy(() => import("./pages/CommunityFund"));
const NotFound          = lazy(() => import("./pages/NotFound"));

// ── QueryClient optimisé ──────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      retryDelay: 2000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ── Fallback de chargement ────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground font-body text-sm">Chargement...</div>
  </div>
);

// ── Error Boundary ────────────────────────────────────────────────────────────
// Capture les erreurs de rendu silencieuses qui causent la page blanche
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Erreur capturée :", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
              Une erreur est survenue
            </h1>
            <p className="text-muted-foreground font-body mb-2 text-sm">
              {this.state.error?.message || "Erreur inattendue"}
            </p>
            <p className="text-xs text-muted-foreground font-body mb-6">
              Consultez la console pour plus de détails.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              className="btn-hero !text-sm !py-2.5 !px-6"
            >
              Retourner à l'accueil
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── App ───────────────────────────────────────────────────────────────────────
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <InstallPWA />
          {/* ErrorBoundary wraps Suspense pour capturer les erreurs de rendu
              des composants enfants (HeroSection, FeaturesSection, etc.)
              qui causaient la page blanche sur "/" */}
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"                     element={<Index />} />
                <Route path="/connexion"            element={<Login />} />
                <Route path="/inscription"          element={<Register />} />
                <Route path="/dashboard"            element={<Dashboard />} />
                <Route path="/portefeuille"         element={<Wallet />} />
                <Route path="/msn-wallet"           element={<MSNWallet />} />
                <Route path="/packs"                element={<Packs />} />
                <Route path="/packs/:id"            element={<PackDetail />} />
                <Route path="/commandes"            element={<Orders />} />
                <Route path="/reseau"               element={<Network />} />
                <Route path="/profil"               element={<Profile />} />
                <Route path="/partenaires"          element={<Partners />} />
                <Route path="/admin"                element={<AdminDashboard />} />
                <Route path="/moissonneurs-pros"    element={<MoissonneursPros />} />
                <Route path="/stand"                element={<Stand />} />
                <Route path="/vente-mandat"         element={<MandateMarketplace />} />
                <Route path="/moissonneur-pays"     element={<MoissonneurPays />} />
                <Route path="/moissonneur-ville"    element={<MoissonneurVille />} />
                <Route path="/porteur-affaires"     element={<PorteurAffaires />} />
                <Route path="/cas-urgents"          element={<UrgentCases />} />
                <Route path="/cas-urgents-zone"     element={<ZoneUrgentCases />} />
                <Route path="/fond-communautaire"   element={<CommunityFund />} />
                <Route path="*"                     element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
