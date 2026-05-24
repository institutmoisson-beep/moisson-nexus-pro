import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { getDistributionProducts, type DistributionProduct } from "@/lib/demo-data";
import { Truck, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const Distribution = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<DistributionProduct[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("#/connexion");
  }, [user, loading, navigate]);

  useEffect(() => {
    setProducts(getDistributionProducts().filter(p => p.is_active));
  }, []);

  const handleBuy = (product: DistributionProduct) => {
    toast.success(`Produit "${product.name}" ajouté ! Commission: ${product.commission_percent}%`);
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">🚚 Distribution</h1>
      <p className="text-muted-foreground font-body mb-8">
        Produits de distribution avec commissions sur chaque vente.
      </p>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <Truck className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-body">Aucun produit de distribution disponible.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="card-elevated hover:shadow-lg transition-shadow">
              <div className="bg-secondary/50 rounded-lg p-8 mb-4 flex items-center justify-center">
                <Truck className="w-16 h-16 text-muted-foreground/30" />
              </div>
              
              <div className="mb-3">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-body">{product.category}</span>
                <span className="text-xs bg-harvest-green/10 text-harvest-green px-2 py-1 rounded-full font-body ml-2">
                  Commission {product.commission_percent}%
                </span>
              </div>

              <h3 className="font-heading font-bold text-lg text-foreground mb-2">{product.name}</h3>
              <p className="text-sm text-muted-foreground font-body mb-4">{product.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-body">Prix</span>
                  <span className="font-heading font-bold text-primary">{product.price.toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-body">Stock</span>
                  <span className="font-semibold text-foreground">{product.stock} unités</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-body">Votre commission</span>
                  <span className="font-heading font-bold text-harvest-green">
                    {Math.round(product.price * product.commission_percent / 100).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              </div>

              <button onClick={() => handleBuy(product)} className="btn-hero w-full !text-sm !py-2.5 flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Acheter / Vendre
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Distribution;
