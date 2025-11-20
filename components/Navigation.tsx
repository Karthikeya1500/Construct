
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
  
  const NavItem = ({ view, icon: Icon, label, primary }: { view: string, icon: any, label: string, primary?: boolean }) => {
    const isActive = currentView === view || (view === 'dashboard' && currentView === 'full-map');
    
    if (primary) {
       return (
         <button 
            onClick={() => onChangeView(view)}
            className="relative -top-6 group"
         >
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/40 border-4 border-[#0B0F19] transition-transform active:scale-95 group-hover:scale-105">
               <Icon className="w-7 h-7 text-white" />
            </div>
            <span className="absolute -bottom-4 w-full text-center text-[10px] font-medium text-gray-400 group-hover:text-white transition-colors">{label}</span>
         </button>
       );
    }

    return (
      <button 
        onClick={() => onChangeView(view)} 
        className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
      >
        <Icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] font-medium">
          {label}
        </span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full bg-[#0B0F19]/95 backdrop-blur-md border-t border-gray-800 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-3 h-16 items-center px-2">
        <NavItem view="dashboard" icon={Home} label="Home" />

        {role === UserRole.PROVIDER ? (
            <NavItem view="post-task" icon={PlusCircle} label="Post Job" primary />
        ) : (
            <NavItem view="my-tasks" icon={Briefcase} label="My Jobs" />
        )}

        <NavItem view="profile" icon={UserIcon} label="Profile" />
      </div>
    </nav>
  );
};

export default Navigation;
