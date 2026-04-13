import React from 'react';
import { useMLMStore } from '../../lib/store';
import { ROLES_CONFIG, UserRole } from '../../types/mlm';
import { 
  Shield, Wallet, Package, Store, Cpu, 
  TrendingUp, Megaphone, User, ChevronRight,
  DollarSign, Users, Activity, ShoppingCart
} from 'lucide-react';

const RoleIcon = ({ iconName }: { iconName: string }) => {
  const icons: Record<string, React.ElementType> = {
    shield: Shield,
    wallet: Wallet,
    package: Package,
    store: Store,
    cpu: Cpu,
    'trending-up': TrendingUp,
    megaphone: Megaphone,
    user: User,
  };
  
  const IconComponent = icons[iconName] || User;
  return <IconComponent className="w-6 h-6" />;
};

export const RoleDashboardSelector: React.FC = () => {
  const { currentUser } = useMLMStore();
  
  if (!currentUser) return null;
  
  const roleConfig = ROLES_CONFIG[currentUser.role];
  
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Votre Tableau de Bord</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Carte du rôle principal */}
        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-3 rounded-full ${getRoleColor(currentUser.role)}`}>
              <RoleIcon iconName={roleConfig.icon} />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-800">{roleConfig.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{roleConfig.description}</p>
        </div>
        
        {/* Métriques rapides */}
        {roleConfig.metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{metric.label}</span>
              {metric.trend && (
                <Activity className={`w-4 h-4 ${
                  metric.trend === 'up' ? 'text-green-500' :
                  metric.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                }`} />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-800">{metric.value}</p>
            {metric.change && (
              <p className={`text-xs mt-1 ${
                metric.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </p>
            )}
          </div>
        ))}
      </div>
      
      {/* Actions rapides */}
      <div className="mt-6">
        <h3 className="font-semibold text-gray-800 mb-3">Actions Rapides</h3>
        <div className="flex flex-wrap gap-2">
          {roleConfig.actions.map((action, index) => (
            <button
              key={index}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
      
      {/* Bouton d'accès au tableau de bord complet */}
      <div className="mt-6">
        <button className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
          <RoleIcon iconName={roleConfig.icon} />
          Accéder à mon espace {roleConfig.name.toLowerCase()}
        </button>
      </div>
    </div>
  );
};

const getRoleColor = (role: UserRole): string => {
  const colors: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-600',
    financier: 'bg-green-100 text-green-600',
    gestion_packs: 'bg-blue-100 text-blue-600',
    gestion_stand: 'bg-purple-100 text-purple-600',
    informaticien: 'bg-gray-100 text-gray-600',
    commercial: 'bg-orange-100 text-orange-600',
    communication: 'bg-pink-100 text-pink-600',
    utilisateur: 'bg-indigo-100 text-indigo-600',
  };
  
  return colors[role] || colors.utilisateur;
};

export default RoleDashboardSelector;
