
import React, { useMemo, useState } from 'react';
import { MapPin, Crosshair, Briefcase, Sparkles, Hammer, Truck, Package } from 'lucide-react';
import { Task } from '../types';

interface MapVisualizerProps {
  tasks?: Task[];
  userLat: number;
  userLng: number;
  destinationLat?: number;
  destinationLng?: number;
  showRoute?: boolean;
  isTrackingMode?: boolean;
  showUserLocation?: boolean;
  onTaskSelect?: (task: Task) => void;
  onUpdateLocation?: () => void;
  fixedRadius?: boolean;
  activeTask?: Task | null;
}

const MapVisualizer: React.FC<MapVisualizerProps> = ({ 
  tasks = [], userLat, userLng, destinationLat, destinationLng, showRoute, isTrackingMode, showUserLocation = true,
  onTaskSelect, onUpdateLocation, fixedRadius, activeTask
}) => {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  const viewState = useMemo(() => {
    // If fixedRadius is true, we center on the user and ignore task bounds
    if (fixedRadius) {
        const delta = 0.015; 
        return {
            minLat: userLat - delta,
            maxLat: userLat + delta,
            minLng: userLng - delta,
            maxLng: userLng + delta
        };
    }

    let minLat = userLat, maxLat = userLat;
    let minLng = userLng, maxLng = userLng;

    if (destinationLat && destinationLng) {
        minLat = Math.min(minLat, destinationLat);
        maxLat = Math.max(maxLat, destinationLat);
        minLng = Math.min(minLng, destinationLng);
        maxLng = Math.max(maxLng, destinationLng);
    } else {
       tasks.forEach(t => {
          minLat = Math.min(minLat, t.location_lat);
          maxLat = Math.max(maxLat, t.location_lat);
          minLng = Math.min(minLng, t.location_lng);
          maxLng = Math.max(maxLng, t.location_lng);
       });
    }

    // Add some padding around bounds
    const latPadding = (maxLat - minLat) * 0.3 || 0.005; 
    const lngPadding = (maxLng - minLng) * 0.3 || 0.005;

    return {
        minLat: minLat - latPadding,
        maxLat: maxLat + latPadding,
        minLng: minLng - lngPadding,
        maxLng: maxLng + lngPadding
    };
  }, [userLat, userLng, destinationLat, destinationLng, tasks.length, fixedRadius]);

  const getPos = (lat: number, lng: number) => {
      const latRange = viewState.maxLat - viewState.minLat;
      const lngRange = viewState.maxLng - viewState.minLng;
      
      const top = ((viewState.maxLat - lat) / latRange) * 100; 
      const left = ((lng - viewState.minLng) / lngRange) * 100;
      // Clamp values to ensure they stay vaguely within view for demo purposes
      return { 
          top: `${Math.max(-20, Math.min(120, top))}%`, 
          left: `${Math.max(-20, Math.min(120, left))}%` 
      };
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Cleaning': return Sparkles;
      case 'Repair': return Hammer;
      case 'Shifting': return Truck;
      case 'Delivery': return Package;
      default: return Briefcase;
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'Cleaning': return 'bg-blue-500 border-blue-400 shadow-blue-500/50';
      case 'Repair': return 'bg-orange-500 border-orange-400 shadow-orange-500/50';
      case 'Shifting': return 'bg-purple-500 border-purple-400 shadow-purple-500/50';
      case 'Delivery': return 'bg-emerald-500 border-emerald-400 shadow-emerald-500/50';
      default: return 'bg-gray-500 border-gray-400 shadow-gray-500/50';
    }
  };

  const userPos = getPos(userLat, userLng);
  const destPos = (destinationLat && destinationLng) ? getPos(destinationLat, destinationLng) : null;

  return (
    <div className="w-full h-full bg-[#111827] relative overflow-hidden rounded-inherit group" onClick={() => setActiveMarkerId(null)}>
      <div className="absolute inset-0 bg-[#111827]">
          <div className="absolute inset-0 opacity-10" 
               style={{ 
                 backgroundImage: 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)', 
                 backgroundSize: '30px 30px'
               }}>
          </div>
      </div>
      
      {/* Route Line */}
      {showRoute && destPos && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <line 
                x1={userPos.left} y1={userPos.top} x2={destPos.left} y2={destPos.top} 
                stroke="#3b82f6" strokeWidth="3" strokeDasharray="6,4" className="opacity-60 animate-pulse" strokeLinecap="round"
              />
          </svg>
      )}

      {/* User Marker (or Worker Marker in Tracking Mode) */}
      {showUserLocation && (
        <div className="absolute transform -translate-x-1/2 -translate-y-1/2 z-40 transition-all duration-1000 ease-linear" style={{ top: userPos.top, left: userPos.left }}>
             <div className="relative flex flex-col items-center justify-center">
                <div className={`w-4 h-4 ${isTrackingMode ? 'bg-green-500' : 'bg-blue-500'} rounded-full border-2 border-white shadow-lg z-20`}></div>
                <div className={`absolute w-12 h-12 ${isTrackingMode ? 'bg-green-500/30' : 'bg-blue-500/30'} rounded-full animate-pulse z-10`}></div>
                {isTrackingMode && <div className="absolute -top-8 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap z-50">Worker Live</div>}
             </div>
        </div>
      )}

      {/* Destination Marker */}
      {destinationLat && destinationLng && destPos && (
          <div className="absolute transform -translate-x-1/2 -translate-y-full z-30" style={{ top: destPos.top, left: destPos.left }}>
              <div className="bg-red-500 p-1.5 rounded-full border-2 border-white shadow-lg mb-1">
                <MapPin className="w-5 h-5 text-white fill-current" />
              </div>
              <div className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap text-center">Job Location</div>
          </div>
      )}

      {/* Job Markers */}
      {tasks.map((task) => {
        if (destinationLat && Math.abs(destinationLat - task.location_lat) < 0.0001) return null;
        
        const pos = getPos(task.location_lat, task.location_lng);
        const isActive = activeMarkerId === task.id || activeTask?.id === task.id;
        const Icon = getCategoryIcon(task.category);
        const colorClass = getCategoryColor(task.category);
        
        return (
          <button
            key={task.id}
            onClick={(e) => { e.stopPropagation(); setActiveMarkerId(task.id); if (onTaskSelect) onTaskSelect(task); }}
            className={`absolute transform -translate-x-1/2 -translate-y-full transition-all duration-500 ease-out z-20 hover:z-50 group`}
            style={{ top: pos.top, left: pos.left }}
          >
            <div className={`relative flex flex-col items-center transition-transform ${isActive ? 'scale-125' : 'scale-100 hover:scale-110'}`}>
              <div className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg ${colorClass}`}>
                 <Icon className="w-4 h-4" />
              </div>
              {/* Tooltip */}
              <div className={`absolute bottom-full mb-2 bg-white text-gray-900 text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}>
                 {task.category} - ${task.budget}
              </div>
            </div>
          </button>
        );
      })}
      
      {onUpdateLocation && !isTrackingMode && (
        <button onClick={(e) => { e.stopPropagation(); onUpdateLocation(); }} className="absolute bottom-4 right-4 bg-white text-gray-900 p-3 rounded-full shadow-xl hover:bg-gray-100 active:scale-90 transition-transform z-50 border border-gray-200">
            <Crosshair className="w-5 h-5 text-blue-600" />
        </button>
      )}
    </div>
  );
};

export default MapVisualizer;
