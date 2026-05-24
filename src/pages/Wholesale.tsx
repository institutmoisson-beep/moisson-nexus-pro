import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { getWholesaleProducts, type WholesaleProduct } from "@/lib/demo-data";
import { Package, ShoppingCart, Users } from "lucide-react";
import { toast } from "sonner";

const Wholesale = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<WholesaleProduct[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("#/connexion");
  }, [user, loading, navigate]);

  useEffect(() => {
    setProducts(getWholesaleProducts().filter(p => p.is_active));
  }, []);

  const handleBuy = (product: WholesaleProduct) => {
    toast.success(`Produit "${product.name}" ajouté au panier !`);
  };

  const handlePropose = (product: WholesaleProduct) => {
    toast.success(`Vous pouvez proposer "${product.name}" à vos clients !`);
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">📦 Produits en Gros</h1>
      <p className="text-muted-foreground font-body mb-8">
        Achetez en gros à prix réduit ou proposez des produits à vos clients et gagnez des commissions.
      </p>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-body">Aucun produit en gros disponible.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="card-elevated hover:shadow-lg transition-shadow">
              <div className="bg-secondary/50 rounded-lg p-8 mb-4 flex items-center justify-center">
                <Package className="w-16 h-16 text-muted-foreground/30" />
              </div>
              
              <div className="mb-3">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-body">{product.category}</span>
                {product.partner_name && (
                  <span className="text-xs bg-gold/10 text-gold px-2 py-1 rounded-full font-body ml-2">{product.partner_name}</span>
                )}
              </div>

              <h3 className="font-heading font-bold text-lg text-foreground mb-2">{product.name}</h3>
              <p className="text-sm text-muted-foreground font-body mb-4">{product.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-body">Quantité min.</span>
                  <span className="font-semibold text-foreground">{product.min_quantity} unités</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-body">Prix unitaire</span>
                  <span className="font-semibold text-foreground">{product.unit_price.toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-body">Prix gros</span>
                  <span className="font-heading font-bold text-harvest-green">{product.bulk_price.toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-body">Économie</span>
                  <span className="font-semibold text-gold">
                    {Math.round((1 - product.bulk_price / product.unit_price) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-body">Stock</span>
                  <span className="font-semibold text-foreground">{product.stock} unités</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleBuy(product)} className="btn-hero flex-1 !text-sm !py-2.5 flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Acheter
                </button>
                <button onClick={() => handlePropose(product)} className="flex-1 px-4 py-2.5 rounded-lg border border-input text-sm font-body text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" /> Proposer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Wholesale;
