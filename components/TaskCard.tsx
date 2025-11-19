
import React from 'react';
import { MapPin, DollarSign, Clock, ArrowRight, User } from 'lucide-react';
import { Task, TaskCategory, TaskStatus, UserRole } from '../types';

interface TaskCardProps {
  task: Task;
  userRole: UserRole;
  onClick: (task: Task) => void;
}

// Helper for "2h ago" format
const timeAgo = (date: number) => {
  const seconds = Math.floor((Date.now() - date) / 1000);
  let interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
};

const getCategoryColor = (category: TaskCategory) => {
  switch (category) {
    case TaskCategory.CLEANING: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case TaskCategory.REPAIR: return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case TaskCategory.SHIFTING: return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case TaskCategory.DELIVERY: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    default: return 'bg-gray-700/30 text-gray-300 border-gray-600/30';
  }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, userRole, onClick }) => {
  return (
    <div 
      onClick={() => onClick(task)}
      className="bg-[#1F2937] p-4 rounded-2xl border border-gray-800 mb-3 relative overflow-hidden active:scale-[0.98] transition-all shadow-lg shadow-black/20 hover:border-gray-700"
    >
      {/* Header: Category & Time */}
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wide ${getCategoryColor(task.category)}`}>
          {task.category}
        </span>
        <span className="text-xs text-gray-500 flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {timeAgo(task.createdAt)}
        </span>
      </div>

      {/* Title & Desc */}
      <h3 className="font-bold text-gray-100 text-lg mb-1 line-clamp-1 leading-tight">{task.title}</h3>
      <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed h-10">{task.description}</p>

      {/* Provider Info (If Worker View) */}
      {userRole === UserRole.WORKER && (
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-700/50">
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-300">
                {task.providerName.charAt(0)}
            </div>
            <span className="text-xs text-gray-400">{task.providerName}</span>
            
            {task.distanceKm !== undefined && (
              <span className="ml-auto text-xs font-medium text-gray-400 flex items-center bg-gray-800 px-2 py-1 rounded-full">
                <MapPin className="w-3 h-3 mr-1 text-blue-400" /> {task.distanceKm.toFixed(1)} km
              </span>
            )}
        </div>
      )}

      {/* Footer: Price & Action */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
           <span className="text-[10px] text-gray-500 uppercase font-bold">Budget</span>
           <div className="flex items-center text-white font-bold text-xl">
             <span className="text-green-500 mr-0.5">$</span>{task.budget}
           </div>
        </div>

        <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center">
            View Details <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
