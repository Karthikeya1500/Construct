
import React, { useMemo } from 'react';
import { MapPin, Search, Crosshair, Navigation, Car } from 'lucide-react';
import { Task } from '../types';

interface MapVisualizerProps {
  tasks?: Task[];
  userLat: number;
  userLng: number;
  destinationLat?: number;
  destinationLng?: number;
  showRoute?: boolean;
  isTrackingMode?: boolean;
  onTaskSelect?: (task: Task) => void;
  onUpdateLocation?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const MapVisualizer: React.FC<MapVisualizerProps> = ({ 
  tasks = [], userLat, userLng, destinationLat, destinationLng, showRoute, isTrackingMode,
  onTaskSelect, onUpdateLocation, searchQuery, onSearchChange 
}) => {

  // Calculate view bounds based on points
  const viewState = useMemo(() => {
    let minLat = userLat, maxLat = userLat;
    let minLng = userLng, maxLng = userLng;

    // Include destination in bounds
    if (destinationLat && destinationLng) {
        minLat = Math.min(minLat, destinationLat);
        maxLat = Math.max(maxLat, destinationLat);
        minLng = Math.min(minLng, destinationLng);
        maxLng = Math.max(maxLng, destinationLng);
    }

    // Include tasks in bounds
    tasks.forEach(t => {
        minLat = Math.min(minLat, t.location_lat);
        maxLat = Math.max(maxLat, t.location_lat);
        minLng = Math.min(minLng, t.location_lng);
        maxLng = Math.max(maxLng, t.location_lng);
    });

    // Add padding
    const latPadding = (maxLat - minLat) * 0.4 || 0.01; // 40% padding
    const lngPadding = (maxLng - minLng) * 0.4 || 0.01;

    return {
        minLat: minLat - latPadding,
        maxLat: maxLat + latPadding,
        minLng: minLng - lngPadding,
        maxLng: maxLng + lngPadding
    };
  }, [userLat, userLng, destinationLat, destinationLng, tasks]);

  // Helper to convert lat/lng to % positions
  const getPos = (lat: number, lng: number) => {
      const latRange = viewState.maxLat - viewState.minLat;
      const lngRange = viewState.maxLng - viewState.minLng;
      
      // Invert Lat because screen Y is top-down
      const top = ((viewState.maxLat - lat) / latRange) * 100; 
      const left = ((lng - viewState.minLng) / lngRange) * 100;
      
      return { top: `${Math.max(5, Math.min(95, top))}%`, left: `${Math.max(5, Math.min(95, left))}%` };
  };

  const userPos = getPos(userLat, userLng);
  const destPos = (destinationLat && destinationLng) ? getPos(destinationLat, destinationLng) : null;

  return (
    <div className="w-full h-72 bg-[#161f30] rounded-3xl relative overflow-hidden border border-gray-800 shadow-2xl group">
      
      {/* Search Bar Overlay */}
      {onSearchChange && (
        <div className="absolute top-4 left-4 right-4 z-40">
          <div className="relative shadow-lg shadow-black/20">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search location..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#1F2937]/90 backdrop-blur-md border border-gray-700 text-white text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Update Location Button */}
      {onUpdateLocation && (
        <button 
          onClick={onUpdateLocation}
          className="absolute bottom-4 right-4 z-40 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg shadow-blue-900/40 transition-transform active:scale-90 flex items-center justify-center"
        >
          <Crosshair className="w-5 h-5" />
        </button>
      )}

      {/* Simulated Map Background */}
      <div className="absolute inset-0 opacity-20" 
           style={{ 
             backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', 
             backgroundSize: '24px 24px',
             backgroundColor: '#0f172a'
           }}>
      </div>

      {/* Route Line (SVG) */}
      {showRoute && destPos && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <line 
                x1={userPos.left} 
                y1={userPos.top} 
                x2={destPos.left} 
                y2={destPos.top} 
                stroke="#3b82f6" 
                strokeWidth="3" 
                strokeDasharray="5,5"
                className="opacity-60 animate-pulse"
              />
          </svg>
      )}

      {/* User Marker (Worker or Self) */}
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center transition-all duration-1000 ease-linear"
        style={{ top: userPos.top, left: userPos.left }}
      >
        <div className={`w-8 h-8 ${isTrackingMode ? 'bg-blue-600' : 'bg-blue-500'} rounded-full border-2 border-white shadow-[0_0_20px_rgba(59,130,246,0.6)] flex items-center justify-center relative`}>
           {isTrackingMode ? <Car className="w-4 h-4 text-white" /> : <div className="w-2 h-2 bg-white rounded-full" />}
           {isTrackingMode && <div className="absolute -inset-2 bg-blue-500/30 rounded-full animate-ping"></div>}
        </div>
        {isTrackingMode && <span className="mt-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-md backdrop-blur-sm">Worker</span>}
      </div>

      {/* Destination Marker (Job) */}
      {destinationLat && destinationLng && destPos && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-full z-20 flex flex-col items-center"
            style={{ top: destPos.top, left: destPos.left }}
          >
              <div className="relative">
                <MapPin className="w-8 h-8 text-red-500 drop-shadow-lg fill-current" />
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rounded-full"></div>
              </div>
              <span className="bg-red-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg mt-1">Job Location</span>
          </div>
      )}

      {/* Nearby Task Markers (Standard View) */}
      {tasks.map((task) => {
        const pos = getPos(task.location_lat, task.location_lng);
        return (
          <button
            key={task.id}
            onClick={(e) => { e.stopPropagation(); onTaskSelect && onTaskSelect(task); }}
            className="absolute transform -translate-x-1/2 -translate-y-full transition-all hover:scale-125 z-20 group-hover:opacity-100"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="relative">
              <MapPin className={`w-8 h-8 ${task.category === 'Cleaning' ? 'text-emerald-400' : 'text-orange-400'} drop-shadow-lg`} fill="currentColor" />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black/50 rounded-full blur-[2px]"></span>
            </div>
          </button>
        );
      })}
      
      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 text-[8px] text-gray-400 rounded backdrop-blur-sm pointer-events-none">
        © Google Maps Data
      </div>
    </div>
  );
};

export default MapVisualizer;
