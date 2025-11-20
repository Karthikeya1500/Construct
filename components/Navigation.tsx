
import React from 'react';
import { Home, PlusCircle, Briefcase, User as UserIcon } from 'lucide-react';
import { UserRole } from '../types';

interface NavigationProps {
  role: UserRole;
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ role, currentView, onChangeView }) => {
  
  const NavItem = ({ view, icon: Icon, label }: { view: string, icon: any, label: string }) => {
    const isActive = currentView === view || (view === 'dashboard' && currentView === 'full-map');

    return (
      <button 
        onClick={() => onChangeView(view)} 
        className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
          isActive ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        <Icon 
          className={`w-6 h-6 mb-1.5 ${isActive ? 'fill-current/20' : ''}`} 
          strokeWidth={isActive ? 2.5 : 2} 
        />
        <span className={`text-[11px] font-medium ${isActive ? 'font-bold' : ''}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full bg-[#0B0F19] border-t border-gray-800 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_20px_rgba(0,0,0,0.3)]">
      <div className="grid grid-cols-3 h-16 items-center px-4">
        <NavItem view="dashboard" icon={Home} label="Home" />

        {role === UserRole.PROVIDER ? (
            <NavItem view="post-task" icon={PlusCircle} label="Post Job" />
        ) : (
            <NavItem view="my-tasks" icon={Briefcase} label="My Jobs" />
        )}

        <NavItem view="profile" icon={UserIcon} label="Profile" />
      </div>
    </nav>
  );
};

export default Navigation;
