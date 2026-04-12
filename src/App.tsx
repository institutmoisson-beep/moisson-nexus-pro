import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import Packs from "./pages/Packs";
import PackDetail from "./pages/PackDetail";
import Network from "./pages/Network";
import Profile from "./pages/Profile";
import Partners from "./pages/Partners";
import AdminDashboard from "./pages/AdminDashboard";
import MoissonneursPros from "./pages/MoissonneursPros";
import Stand from "./pages/Stand";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/connexion" element={<Login />} />
            <Route path="/inscription" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portefeuille" element={<Wallet />} />
            <Route path="/packs" element={<Packs />} />
            <Route path="/packs/:id" element={<PackDetail />} />
            <Route path="/reseau" element={<Network />} />
            <Route path="/profil" element={<Profile />} />
            <Route path="/partenaires" element={<Partners />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/moissonneurs-pros" element={<MoissonneursPros />} />
            <Route path="/stand" element={<Stand />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
