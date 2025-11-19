
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
    const isActive = currentView === view;
    return (
      <button 
        onClick={() => onChangeView(view)} 
        className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 group relative ${isActive ? 'text-blue-500' : 'text-gray-500'}`}
      >
        <div className={`relative p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-blue-500/10 -translate-y-1' : 'group-hover:bg-gray-800'}`}>
          <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : 'stroke-current'}`} strokeWidth={isActive ? 2.5 : 2} />
          {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></span>}
        </div>
        <span className={`text-[10px] font-semibold mt-1 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full bg-[#0B0F19]/95 backdrop-blur-xl border-t border-gray-800 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-3 h-20 items-center max-w-md mx-auto">
        <NavItem view="dashboard" icon={Home} label="Home" />

        {role === UserRole.PROVIDER && (
          <NavItem view="post-task" icon={PlusCircle} label="Post Job" />
        )}

        {role === UserRole.WORKER && (
          <NavItem view="my-tasks" icon={Briefcase} label="My Jobs" />
        )}

        <NavItem view="profile" icon={UserIcon} label="Profile" />
      </div>
    </nav>
  );
};

export default Navigation;
