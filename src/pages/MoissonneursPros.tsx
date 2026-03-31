import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Phone, Mail, User } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const MoissonneursPros = () => {
  const [pros, setPros] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("profiles")
      .select("first_name, last_name, email, phone, career_level, avatar_url, city, country")
      .eq("is_pro_visible", true)
      .eq("is_suspended", false)
      .then(({ data }) => setPros(data || []));
  }, []);

  const filtered = pros.filter(p =>
    `${p.first_name} ${p.last_name} ${p.city || ""} ${p.country || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">🌾 Annuaire Moissonneurs Pros</h1>
      <p className="text-muted-foreground font-body mb-6">
        Retrouvez les professionnels certifiés de notre réseau
      </p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input placeholder="Rechercher par nom, ville, pays..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p, i) => (
          <div key={i} className="card-elevated flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.first_name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">{p.first_name} {p.last_name}</h3>
                <p className="text-xs text-muted-foreground font-body capitalize">{p.career_level?.replace(/_/g, " ")}</p>
              </div>
            </div>
            {(p.city || p.country) && (
              <p className="text-xs text-muted-foreground font-body mb-2">📍 {[p.city, p.country].filter(Boolean).join(", ")}</p>
            )}
            <div className="mt-auto pt-3 border-t border-border flex flex-wrap gap-2">
              {p.phone && (
                <a href={`https://wa.me/${p.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-harvest-green/10 text-harvest-green text-xs font-body font-semibold hover:bg-harvest-green/20">
                  <Phone className="w-3 h-3" /> WhatsApp
                </a>
              )}
              {p.email && (
                <a href={`mailto:${p.email}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-body font-semibold hover:bg-primary/20">
                  <Mail className="w-3 h-3" /> Email
                </a>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground font-body col-span-3 text-center py-12">Aucun moissonneur pro trouvé</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MoissonneursPros;
