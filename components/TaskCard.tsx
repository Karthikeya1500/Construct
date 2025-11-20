
import React from 'react';
import { MapPin, ArrowRight, Clock, DollarSign, Users, CheckCircle } from 'lucide-react';
import { Task, TaskCategory, UserRole, TaskStatus } from '../types';

interface TaskCardProps {
  task: Task;
  userRole: UserRole;
  onClick: (task: Task) => void;
}

const timeAgo = (date: number) => {
  const seconds = Math.floor((Date.now() - date) / 1000);
  let interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
};

const getStatusStyle = (status: TaskStatus) => {
    switch(status) {
        case TaskStatus.ASSIGNED: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case TaskStatus.APPLIED: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
        case TaskStatus.IN_PROGRESS: return 'bg-green-500/10 text-green-400 border-green-500/20';
        case TaskStatus.COMPLETED: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        default: return 'bg-gray-700/30 text-gray-300 border-gray-600/30';
    }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, userRole, onClick }) => {
  return (
    <div 
      onClick={() => onClick(task)}
      className="bg-[#1F2937] p-4 rounded-xl border border-gray-800 mb-3 relative overflow-hidden active:scale-[0.99] transition-all shadow-sm hover:border-gray-700 group"
    >
      {/* Hired Badge for Worker */}
      {userRole === UserRole.WORKER && (task.status === TaskStatus.ASSIGNED || task.status === TaskStatus.IN_PROGRESS) && (
          <div className="absolute top-0 right-0 bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg shadow-lg flex items-center">
              <CheckCircle className="w-2.5 h-2.5 mr-1" /> HIRED
          </div>
      )}

      {/* Header Row */}
      <div className="flex justify-between items-start mb-2">
         <div className="flex items-center gap-2">
             <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide bg-gray-700 text-gray-300 border-gray-600">
                {task.category}
             </span>
             {task.status !== TaskStatus.OPEN && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${getStatusStyle(task.status)}`}>
                    {task.status.replace('_', ' ')}
                </span>
             )}
         </div>
         <span className="text-[10px] text-gray-500 font-medium">
            {timeAgo(task.createdAt)}
         </span>
      </div>

      {/* Title & Description */}
      <div className="mb-3">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-gray-100 text-base mb-1 leading-tight pr-2 flex-1 group-hover:text-blue-400 transition-colors">{task.title}</h3>
            <div className="text-green-400 font-bold text-base whitespace-nowrap bg-green-500/10 px-2 py-0.5 rounded">
                ${task.budget}
            </div>
          </div>
          <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
          
          <div className="flex items-center justify-between text-xs text-gray-400">
              {task.distanceKm !== undefined && (
                <span className="flex items-center bg-gray-800 px-2 py-1 rounded">
                    <MapPin className="w-3 h-3 mr-1 text-blue-400" /> {task.distanceKm.toFixed(1)} km
                </span>
              )}
              {userRole === UserRole.WORKER && (
                  <span className="flex items-center text-[10px]">
                      By {task.providerName}
                  </span>
              )}
              {userRole === UserRole.PROVIDER && task.applicants && (
                  <span className="flex items-center bg-gray-800 px-2 py-1 rounded text-gray-300">
                      <Users className="w-3 h-3 mr-1" /> {task.applicants.length} Applied
                  </span>
              )}
          </div>
      </div>

      {/* Footer Action */}
      <div className="border-t border-gray-700/50 pt-2 flex justify-between items-center mt-2">
         <div className="flex items-center gap-2">
             <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[9px] font-bold text-white overflow-hidden">
                {userRole === UserRole.WORKER ? (task.providerPhoto ? <img src={task.providerPhoto} alt="p" className="w-full h-full" /> : task.providerName[0]) : (task.category[0])}
             </div>
             <span className="text-[10px] text-gray-500">
                 {userRole === UserRole.WORKER ? "Verified Provider" : (task.status === TaskStatus.OPEN ? "Accepting Applications" : "Job Active")}
             </span>
         </div>
         <button className="text-blue-400 text-xs font-bold flex items-center hover:text-blue-300 transition-colors">
            {userRole === UserRole.PROVIDER ? 'Manage Job' : 'View Details'} <ArrowRight className="w-3 h-3 ml-1" />
         </button>
      </div>
    </div>
  );
};

export default TaskCard;
