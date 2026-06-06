import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { lazy, Suspense, Component, ReactNode } from "react";

const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Packs = lazy(() => import("./pages/Packs"));
const PackDetail = lazy(() => import("./pages/PackDetail"));
const Orders = lazy(() => import("./pages/Orders"));
const Network = lazy(() => import("./pages/Network"));
const Profile = lazy(() => import("./pages/Profile"));
const Partners = lazy(() => import("./pages/Partners"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminPacks = lazy(() => import("./pages/AdminPacks"));
const MoissonneursPros = lazy(() => import("./pages/MoissonneursPros"));
const Stand = lazy(() => import("./pages/Stand"));
const MSNWallet = lazy(() => import("./pages/MSNWallet"));
const MandateMarketplace = lazy(() => import("./pages/MandateMarketplace"));
const MoissonneurPays = lazy(() => import("./pages/MoissonneurPays"));
const MoissonneurVille = lazy(() => import("./pages/MoissonneurVille"));
const PorteurAffaires = lazy(() => import("./pages/PorteurAffaires"));
const UrgentCases = lazy(() => import("./pages/UrgentCases"));
const ZoneUrgentCases = lazy(() => import("./pages/ZoneUrgentCases"));
const CommunityFund = lazy(() => import("./pages/CommunityFund"));
const Wholesale = lazy(() => import("./pages/Wholesale"));
const Distribution = lazy(() => import("./pages/Distribution"));
const AdminWholesale = lazy(() => import("./pages/AdminWholesale"));
const AdminDistribution = lazy(() => import("./pages/AdminDistribution"));
const CarteIdentite = lazy(() => import("./pages/CarteIdentite"));
const Verifier = lazy(() => import("./pages/Verifier"));
const NotFound = lazy(() => import("./pages/NotFound"));
import InstallPWA from "@/components/InstallPWA";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000, retry: 1, retryDelay: 2000, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground font-body text-sm">Chargement...</div>
  </div>
);

interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Une erreur est survenue</h1>
            <p className="text-muted-foreground font-body mb-6 text-sm">{this.state.error?.message || "Erreur inattendue"}</p>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.hash = "#/"; }} className="btn-hero !text-sm !py-2.5 !px-6">
              Retourner à l'accueil
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <HashRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/connexion" element={<Login />} />
                <Route path="/inscription" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/portefeuille" element={<Wallet />} />
                <Route path="/msn-wallet" element={<MSNWallet />} />
                <Route path="/packs" element={<Packs />} />
                <Route path="/packs/:id" element={<PackDetail />} />
                <Route path="/commandes" element={<Orders />} />
                <Route path="/reseau" element={<Network />} />
                <Route path="/profil" element={<Profile />} />
                <Route path="/partenaires" element={<Partners />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/packs" element={<AdminPacks />} />
                <Route path="/admin/wholesale" element={<AdminWholesale />} />
                <Route path="/admin/distribution" element={<AdminDistribution />} />
                <Route path="/moissonneurs-pros" element={<MoissonneursPros />} />
                <Route path="/stand" element={<Stand />} />
                <Route path="/vente-mandat" element={<MandateMarketplace />} />
                <Route path="/moissonneur-pays" element={<MoissonneurPays />} />
                <Route path="/moissonneur-ville" element={<MoissonneurVille />} />
                <Route path="/porteur-affaires" element={<PorteurAffaires />} />
                <Route path="/cas-urgents" element={<UrgentCases />} />
                <Route path="/cas-urgents-zone" element={<ZoneUrgentCases />} />
                <Route path="/fond-communautaire" element={<CommunityFund />} />
                <Route path="/produits-en-gros" element={<Wholesale />} />
                <Route path="/distribution" element={<Distribution />} />
                <Route path="/carte-identite" element={<CarteIdentite />} />
                <Route path="/verifier" element={<Verifier />} />
                <Route path="/verify" element={<Verifier />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
