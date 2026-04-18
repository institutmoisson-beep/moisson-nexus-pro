import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";

// ── Lazy loading de toutes les pages ─────────────────────────────────────────
// Chaque page est chargée uniquement quand l'utilisateur y navigue.
// Réduit drastiquement le bundle initial (~60-70% selon les pages).
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
const NotFound          = lazy(() => import("./pages/NotFound"));

// ── QueryClient optimisé pour 100 000+ utilisateurs ──────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Garde les données fraîches 2 minutes sans refetch
      staleTime: 2 * 60 * 1000,
      // Garde en cache 10 minutes après que le composant soit démonté
      gcTime: 10 * 60 * 1000,
      // Pas de retry automatique en cas d'erreur réseau (évite le flood)
      retry: 1,
      retryDelay: 2000,
      // Pas de refetch au focus (réduit les appels Supabase)
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

// ── App ───────────────────────────────────────────────────────────────────────
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"                   element={<Index />} />
              <Route path="/connexion"          element={<Login />} />
              <Route path="/inscription"        element={<Register />} />
              <Route path="/dashboard"          element={<Dashboard />} />
              <Route path="/portefeuille"       element={<Wallet />} />
              <Route path="/msn-wallet"         element={<MSNWallet />} />
              <Route path="/packs"              element={<Packs />} />
              <Route path="/packs/:id"          element={<PackDetail />} />
              <Route path="/commandes"          element={<Orders />} />
              <Route path="/reseau"             element={<Network />} />
              <Route path="/profil"             element={<Profile />} />
              <Route path="/partenaires"        element={<Partners />} />
              <Route path="/admin"              element={<AdminDashboard />} />
              <Route path="/moissonneurs-pros"  element={<MoissonneursPros />} />
              <Route path="/stand"              element={<Stand />} />
              <Route path="/vente-mandat"       element={<MandateMarketplace />} />
              <Route path="/moissonneur-pays"   element={<MoissonneurPays />} />
              <Route path="/moissonneur-ville"  element={<MoissonneurVille />} />
              <Route path="*"                   element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
