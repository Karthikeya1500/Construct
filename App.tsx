
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, Task, TaskStatus, TaskCategory, AIAnalysisResult, Notification, AppliedWorker } from './types';
import { INITIAL_TASKS, MOCK_NOTIFICATIONS, MOCK_USER, MOCK_PROVIDER } from './services/mockData';
import { analyzeTaskDescription } from './services/geminiService';
import { isConfigured } from './services/authService';
import Navigation from './components/Navigation';
import TaskCard from './components/TaskCard';
import MapVisualizer from './components/MapVisualizer';
import { 
  Sparkles, Loader2, MapPin, CheckCircle, AlertTriangle, 
  ChevronLeft, Briefcase, Lock, Mail, User as UserIcon, 
  Bell, LogOut, Edit3, ChevronRight, Settings, Shield, Clock, DollarSign,
  Hammer, Truck, Package, Smartphone, Moon, LogIn, Search, Navigation as NavIcon, HelpCircle, FileText,
  Users, PlayCircle, Phone, UserPlus, PlusCircle, PhoneCall
} from 'lucide-react';

// --- Utilities ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI/180);
  const dLon = (lon2 - lon1) * (Math.PI/180);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

// --- Shared Components ---
const Toast = ({ message, type }: { message: string, type: 'success'|'error' }) => (
  <div className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
    {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
    <span className="text-sm font-bold">{message}</span>
  </div>
);

const InputField = ({ icon: Icon, type, placeholder, value, onChange, label, error, multiline }: any) => (
  <div className="mb-4 w-full">
    {label && <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">{label}</label>}
    <div className="relative">
      {Icon && <div className="absolute top-3.5 left-0 pl-4 flex items-center pointer-events-none"><Icon className="h-5 w-5 text-gray-500" /></div>}
      {multiline ? (
        <textarea
            className={`w-full bg-[#1F2937] border ${error ? 'border-red-500' : 'border-gray-700'} text-white rounded-xl py-3.5 ${Icon ? 'pl-11' : 'pl-4'} pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm h-24`}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
        />
      ) : (
        <input
            type={type}
            className={`w-full bg-[#1F2937] border ${error ? 'border-red-500' : 'border-gray-700'} text-white rounded-xl py-3.5 ${Icon ? 'pl-11' : 'pl-4'} pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm`}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
        />
      )}
    </div>
  </div>
);

const Header = ({ title, onBack, rightAction }: { title: string, onBack?: () => void, rightAction?: React.ReactNode }) => (
  <div className="flex items-center justify-between p-4 pt-12 bg-[#0B0F19] sticky top-0 z-50 border-b border-gray-800/50 backdrop-blur-md bg-opacity-90">
      <div className="flex items-center gap-3">
          {onBack && (
              <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <ChevronLeft className="w-5 h-5 text-white" />
              </button>
          )}
          <h1 className="text-lg font-bold text-white">{title}</h1>
      </div>
      {rightAction}
  </div>
);

const CategoryPill = ({ label, icon: Icon, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center min-w-[70px] p-2 rounded-xl transition-all border ${active ? 'bg-blue-600 border-blue-500 text-white scale-105 shadow-lg shadow-blue-900/50' : 'bg-[#1F2937] border-gray-700 text-gray-400'}`}
  >
      <Icon className="w-5 h-5 mb-1" />
      <span className="text-[10px] font-medium">{label}</span>
  </button>
);

// --- Auth Flow ---
const AuthFlow: React.FC<{ onComplete: (user: User) => void }> = ({ onComplete }) => {
  // Steps: login -> signup (form) -> role_selection (cards)
  const [step, setStep] = useState<'login' | 'signup' | 'role_selection'>('login');
  const [formData, setFormData] = useState({ email: '', password: '', name: '', role: UserRole.WORKER });
  const [isLoading, setIsLoading] = useState(false);

  const finalizeSignup = (selectedRole: UserRole) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        const newUser: User = {
            id: 'new-' + Date.now(),
            name: formData.name || 'New User',
            email: formData.email || 'user@example.com',
            role: selectedRole,
            phone: '',
            location_lat: 40.7128,
            location_lng: -74.0060,
            address: 'New User Address',
            rating: 5.0,
            completedTasks: 0,
            skills: [],
            photoURL: `https://ui-avatars.com/api/?name=${formData.name || 'New User'}&background=random`
        };
        onComplete(newUser);
        setIsLoading(false);
    }, 800);
  };

  // 🧑‍💼 Step 3: Role Selection Screen
  if (step === 'role_selection') {
     return (
        <div className="flex flex-col h-full p-6 pt-20 bg-[#0B0F19] animate-in fade-in items-center justify-center">
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
                    <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Select Your Role</h2>
                <p className="text-gray-400">How would you like to use WorkLink?</p>
            </div>

            <div className="grid gap-6 w-full max-w-sm">
                <button 
                    onClick={() => finalizeSignup(UserRole.WORKER)} 
                    className="group relative p-6 bg-[#1F2937] rounded-2xl border border-gray-700 hover:border-blue-500 transition-all shadow-lg active:scale-95 flex items-center text-left"
                >
                    <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mr-4 group-hover:bg-blue-500/20 transition-colors">
                        <span className="text-2xl">👷</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">Worker</h3>
                        <p className="text-sm text-gray-400">Find nearby jobs & earn</p>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="text-blue-400" />
                    </div>
                </button>

                <button 
                    onClick={() => finalizeSignup(UserRole.PROVIDER)} 
                    className="group relative p-6 bg-[#1F2937] rounded-2xl border border-gray-700 hover:border-green-500 transition-all shadow-lg active:scale-95 flex items-center text-left"
                >
                    <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mr-4 group-hover:bg-green-500/20 transition-colors">
                        <span className="text-2xl">🧑‍🔧</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-green-400 transition-colors">Provider</h3>
                        <p className="text-sm text-gray-400">Post jobs & hire workers</p>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="text-green-400" />
                    </div>
                </button>
            </div>
        </div>
     );
  }

  // 📝 Step 2: Clean Normal Sign-Up Form
  if (step === 'signup') {
      return (
        <div className="flex flex-col h-full p-6 pt-20 bg-[#0B0F19] overflow-y-auto animate-in slide-in-from-right">
            <button onClick={() => setStep('login')} className="mb-6 flex items-center text-gray-400 hover:text-white">
                <ChevronLeft className="w-5 h-5 mr-1" /> Back
            </button>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Create Account</h1>
                <p className="text-gray-400 mt-2">Enter your details to get started.</p>
            </div>
            
            <div className="space-y-4">
                <InputField icon={UserIcon} type="text" placeholder="Full Name" value={formData.name} onChange={(e:any) => setFormData({...formData, name: e.target.value})} />
                <InputField icon={Mail} type="email" placeholder="Email Address" value={formData.email} onChange={(e:any) => setFormData({...formData, email: e.target.value})} />
                <InputField icon={Lock} type="password" placeholder="Password" value={formData.password} onChange={(e:any) => setFormData({...formData, password: e.target.value})} />
            </div>
            
            <button 
                onClick={() => setStep('role_selection')} 
                disabled={!formData.email || !formData.password || !formData.name}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-8 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Create Account
            </button>
        </div>
      );
  }

  // 🔑 Step 1: Login Screen
  return (
      <div className="flex flex-col h-full p-6 justify-center bg-[#0B0F19] animate-in fade-in">
          <div className="mb-10 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-900/50">
                  <Briefcase className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white tracking-tight">WorkLink</h1>
              <p className="text-gray-400 mt-2">Connect. Work. Earn.</p>
          </div>

          <div className="space-y-4 w-full max-w-sm mx-auto">
              <InputField icon={Mail} type="email" placeholder="Email Address" value={formData.email} onChange={(e:any) => setFormData({...formData, email: e.target.value})} />
              <InputField icon={Lock} type="password" placeholder="Password" value={formData.password} onChange={(e:any) => setFormData({...formData, password: e.target.value})} />
              
              <button onClick={() => onComplete(MOCK_USER)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30">
                  Log In
              </button>
              
              <p className="mt-8 text-center text-gray-500 text-sm">Don't have an account? <button onClick={() => setStep('signup')} className="text-blue-400 font-bold hover:underline">Sign Up</button></p>
          </div>
      </div>
  );
};

// --- Main App ---
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'All'>('All');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'ASSIGNED' | 'ONGOING' | 'COMPLETED'>('ASSIGNED');
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  
  // Maps & Tracking
  const [isTracking, setIsTracking] = useState(false);
  const [workerLocation, setWorkerLocation] = useState<{lat: number, lng: number} | null>(null);

  // Post Job States
  const [taskPrompt, setTaskPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedTask, setAnalyzedTask] = useState<AIAnalysisResult | null>(null);
  const [isEditingJob, setIsEditingJob] = useState(false);

  // Derived Data
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (activeCategory !== 'All') {
        result = result.filter(task => task.category === activeCategory);
    }
    return result;
  }, [tasks, activeCategory]);

  const myJobs = useMemo(() => {
    if (!user) return [];
    if (user.role === UserRole.WORKER) {
        // For workers: 
        // ASSIGNED = jobs where they are APPLIED or ASSIGNED/IN_PROGRESS
        // ONGOING = job status IN_PROGRESS and they are the worker
        // COMPLETED = job status COMPLETED and they are the worker
        if (activeTab === 'ASSIGNED') {
            return tasks.filter(t => 
                (t.status === TaskStatus.APPLIED || t.status === TaskStatus.ASSIGNED || t.status === TaskStatus.IN_PROGRESS) && 
                t.applicants?.some(a => a.workerId === user.id)
            );
        }
        if (activeTab === 'ONGOING') return tasks.filter(t => t.status === TaskStatus.IN_PROGRESS && t.workerId === user.id);
        if (activeTab === 'COMPLETED') return tasks.filter(t => t.status === TaskStatus.COMPLETED && t.workerId === user.id);
        return [];
    } else {
        // Provider Logic
        if (activeTab === 'ASSIGNED') return tasks.filter(t => t.providerId === user.id && (t.status === TaskStatus.OPEN || t.status === TaskStatus.APPLIED));
        if (activeTab === 'ONGOING') return tasks.filter(t => t.providerId === user.id && t.status === TaskStatus.IN_PROGRESS);
        if (activeTab === 'COMPLETED') return tasks.filter(t => t.providerId === user.id && t.status === TaskStatus.COMPLETED);
        return tasks.filter(t => t.providerId === user.id);
    }
  }, [tasks, user, activeTab]);

  // Effects
  useEffect(() => {
      if (user) {
          setTasks(prev => prev.map(t => ({
              ...t,
              distanceKm: calculateDistance(user.location_lat, user.location_lng, t.location_lat, t.location_lng)
          })));
          setWorkerLocation({ lat: user.location_lat, lng: user.location_lng });
      }
  }, [user]);

  // Tracking Simulation
  useEffect(() => {
      let interval: any;
      if (isTracking && workerLocation && selectedTask) {
          interval = setInterval(() => {
              // Move worker closer to destination
              setWorkerLocation(prev => {
                  if (!prev) return null;
                  const latDiff = selectedTask.location_lat - prev.lat;
                  const lngDiff = selectedTask.location_lng - prev.lng;
                  return {
                      lat: prev.lat + latDiff * 0.05, // Move slower for realism
                      lng: prev.lng + lngDiff * 0.05
                  };
              });
          }, 5000); // Update every 5 seconds as requested
      }
      return () => clearInterval(interval);
  }, [isTracking, selectedTask]);

  // Handlers
  const showToast = (msg: string, type: 'success'|'error') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => setUser(null);
  
  const handlePostTask = () => {
      if (!analyzedTask || !user) return;
      const newTask: Task = {
          id: `t-${Date.now()}`,
          providerId: user.id,
          providerName: user.name,
          providerPhone: user.phone || '123-456-7890',
          title: analyzedTask.title,
          description: analyzedTask.description,
          budget: analyzedTask.budget || 0,
          category: analyzedTask.category,
          location_lat: user.location_lat + (Math.random() - 0.5) * 0.01,
          location_lng: user.location_lng + (Math.random() - 0.5) * 0.01,
          address: analyzedTask.locationText || user.address,
          status: TaskStatus.OPEN,
          createdAt: Date.now(),
          date: analyzedTask.date || 'Flexible',
          skills: analyzedTask.skills,
          applicants: []
      };
      setTasks([newTask, ...tasks]);
      setAnalyzedTask(null);
      setTaskPrompt('');
      setIsEditingJob(false);
      setCurrentView('dashboard');
      showToast("Job Posted Successfully", "success");
  };

  const handleAnalyzeTask = async () => {
      if (!taskPrompt.trim()) return;
      setIsAnalyzing(true);
      const result = await analyzeTaskDescription(taskPrompt);
      setAnalyzedTask(result);
      setIsAnalyzing(false);
      setIsEditingJob(true); // Default to view, but editable via button
  };

  const handleAcceptTask = (task: Task) => {
      if (!user) return;
      const updatedTasks = tasks.map(t => {
          if (t.id === task.id) {
              return {
                  ...t,
                  status: TaskStatus.APPLIED, // 1. Status: Applied
                  applicants: [...(t.applicants || []), { // 1. Add worker
                      workerId: user.id,
                      workerName: user.name,
                      workerRating: user.rating || 5.0,
                      status: 'pending',
                      distanceKm: t.distanceKm,
                      workerPhoto: user.photoURL
                  }]
              } as Task;
          }
          return t;
      });
      setTasks(updatedTasks);
      const updatedTask = updatedTasks.find(t => t.id === task.id);
      if (updatedTask) setSelectedTask(updatedTask);
      
      showToast("Task Applied! Waiting for provider approval.", "success");
  };

  const handleProviderAction = (taskId: string, workerId: string, action: 'accept'|'reject') => {
      const updatedTasks = tasks.map(t => {
          if (t.id === taskId) {
              const newApplicants = t.applicants?.map(a => 
                  a.workerId === workerId ? { ...a, status: action === 'accept' ? 'accepted' : 'rejected' } : a
              ) as AppliedWorker[];
              
              const applicant = t.applicants?.find(a => a.workerId === workerId);

              return {
                  ...t,
                  status: action === 'accept' ? TaskStatus.ASSIGNED : t.status, // 2. Status: Assigned
                  applicants: newApplicants,
                  workerId: action === 'accept' ? workerId : t.workerId,
                  workerName: action === 'accept' ? applicant?.workerName : t.workerName
              };
          }
          return t;
      });
      setTasks(updatedTasks);
      const updatedTask = updatedTasks.find(t => t.id === taskId);
      if (updatedTask) setSelectedTask(updatedTask);
      
      if (action === 'accept') {
          // 3. Push Notification to Worker
          const newNotification: Notification = {
              id: `n-${Date.now()}`,
              title: "Job Assigned!",
              message: `You have been hired for "${updatedTask?.title}" by ${updatedTask?.providerName}`,
              time: "Just now",
              read: false,
              type: "success"
          };
          setNotifications([newNotification, ...notifications]);
          
          // Enable tracking for Provider
          setIsTracking(true); 
          showToast("Worker Hired. Tracking enabled.", "success");
      }
  };

  // --- Render Views ---

  const renderNotifications = () => (
      <div className="h-full bg-[#0B0F19] flex flex-col pb-24">
          <Header title="Notifications" onBack={() => setCurrentView('dashboard')} />
          <div className="p-4 space-y-3 overflow-y-auto">
              {notifications.length === 0 ? (
                  <div className="text-center text-gray-500 mt-20 flex flex-col items-center">
                      <Bell className="w-12 h-12 mb-4 opacity-20" />
                      <p>No notifications yet</p>
                  </div>
              ) : (
                  notifications.map(n => (
                      <div key={n.id} className={`p-4 rounded-xl border border-gray-800 flex gap-3 ${n.read ? 'bg-[#0B0F19]' : 'bg-[#1F2937]'}`}>
                          <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${n.type === 'success' ? 'bg-green-500' : n.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                          <div>
                              <h4 className="text-white font-bold text-sm">{n.title}</h4>
                              <p className="text-gray-400 text-xs mt-1">{n.message}</p>
                              <p className="text-gray-600 text-[10px] mt-2">{n.time}</p>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
  );

  const renderEditProfile = () => (
      <div className="h-full bg-[#0B0F19] flex flex-col pb-24 animate-in slide-in-from-right">
          <Header title="Edit Profile" onBack={() => setCurrentView('settings')} />
          <div className="p-4 space-y-4 overflow-y-auto">
              <div className="flex justify-center mb-6">
                  <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#1F2937]">
                          <img src={user?.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <button className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white shadow-lg active:scale-90 transition-transform">
                          <Edit3 className="w-4 h-4" />
                      </button>
                  </div>
              </div>
              <InputField label="Full Name" value={user?.name} onChange={(e: any) => setUser({...user!, name: e.target.value})} type="text" />
              <InputField label="Phone" value={user?.phone} onChange={(e: any) => setUser({...user!, phone: e.target.value})} type="tel" />
              <InputField label="Email" value={user?.email} onChange={(e: any) => setUser({...user!, email: e.target.value})} type="email" />
              <InputField label="Address" value={user?.address} onChange={(e: any) => setUser({...user!, address: e.target.value})} type="text" />
              {user?.role === UserRole.WORKER && (
                  <InputField label="Bio" multiline value={user?.bio} onChange={(e: any) => setUser({...user!, bio: e.target.value})} />
              )}
              <button onClick={() => { showToast('Profile Updated', 'success'); setCurrentView('settings'); }} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 shadow-lg shadow-blue-900/30">Save Changes</button>
          </div>
      </div>
  );

  const renderChangePassword = () => (
    <div className="h-full bg-[#0B0F19] flex flex-col pb-24 animate-in slide-in-from-right">
        <Header title="Change Password" onBack={() => setCurrentView('settings')} />
        <div className="p-4 space-y-4">
            <InputField label="Current Password" type="password" placeholder="••••••" />
            <InputField label="New Password" type="password" placeholder="••••••" />
            <InputField label="Confirm New Password" type="password" placeholder="••••••" />
            <button onClick={() => { showToast('Password Changed', 'success'); setCurrentView('settings'); }} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 shadow-lg shadow-blue-900/30">Update Password</button>
        </div>
    </div>
  );

  const renderChangePhone = () => (
    <div className="h-full bg-[#0B0F19] flex flex-col pb-24 animate-in slide-in-from-right">
        <Header title="Change Phone" onBack={() => setCurrentView('settings')} />
        <div className="p-4 space-y-4">
             <p className="text-gray-400 text-sm mb-2">We will send a verification code to your new number.</p>
            <InputField label="New Phone Number" type="tel" placeholder="+1 (555) 000-0000" />
            <button onClick={() => { showToast('Verification Code Sent', 'success'); setCurrentView('settings'); }} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 shadow-lg shadow-blue-900/30">Send Code</button>
        </div>
    </div>
  );

  const renderUpdateLocation = () => (
    <div className="h-full bg-[#0B0F19] flex flex-col pb-24 animate-in slide-in-from-right">
        <Header title="Update Location" onBack={() => setCurrentView('settings')} />
        <div className="p-4 space-y-6">
            <div className="bg-[#1F2937] p-6 rounded-xl border border-gray-800 text-center">
                <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-white font-bold mb-1">Current Location</h3>
                <p className="text-gray-400 text-sm">{user?.address || "Location not set"}</p>
                <p className="text-xs text-gray-500 mt-2">Lat: {user?.location_lat.toFixed(4)}, Lng: {user?.location_lng.toFixed(4)}</p>
            </div>
            <button onClick={() => { showToast('Location Updated using GPS', 'success'); setCurrentView('settings'); }} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2">
                <NavIcon className="w-5 h-5" /> Use Current GPS
            </button>
        </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="h-full bg-[#0B0F19] flex flex-col pb-24 animate-in slide-in-from-right">
        <Header title="Notification Settings" onBack={() => setCurrentView('settings')} />
        <div className="p-4 space-y-4">
            {['Push Notifications', 'Email Alerts', 'SMS Updates', 'Marketing'].map((item, i) => (
                <div key={i} className="w-full bg-[#1F2937] p-4 rounded-xl flex items-center justify-between text-white">
                    <span className="font-medium">{item}</span>
                    <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderPrivacyPolicy = () => (
    <div className="h-full bg-[#0B0F19] flex flex-col pb-24 animate-in slide-in-from-right">
        <Header title="Privacy Policy" onBack={() => setCurrentView('settings')} />
        <div className="p-6 overflow-y-auto text-gray-300 space-y-4 text-sm leading-relaxed">
            <h3 className="text-white font-bold text-lg">1. Data Collection</h3>
            <p>We collect personal information you provide directly to us, such as when you create an account, update your profile, or post a task.</p>
            <h3 className="text-white font-bold text-lg">2. Location Data</h3>
            <p>We use your location to connect you with nearby tasks or workers. This data is stored securely.</p>
            <h3 className="text-white font-bold text-lg">3. Security</h3>
            <p>We implement industry-standard security measures to protect your data.</p>
        </div>
    </div>
  );

  const renderSupport = () => (
    <div className="h-full bg-[#0B0F19] flex flex-col pb-24 animate-in slide-in-from-right">
        <Header title="Help & Support" onBack={() => setCurrentView('settings')} />
        <div className="p-4 space-y-4">
            <div className="bg-[#1F2937] p-6 rounded-xl border border-gray-800 text-center mb-4">
                <HelpCircle className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <h3 className="text-white font-bold text-lg">How can we help?</h3>
                <p className="text-gray-400 text-sm mt-1">Our support team is available 24/7.</p>
            </div>
            <button className="w-full bg-[#1F2937] p-4 rounded-xl flex items-center justify-between text-white hover:bg-gray-800">
                <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-gray-400" /> Email Support</div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            <button className="w-full bg-[#1F2937] p-4 rounded-xl flex items-center justify-between text-white hover:bg-gray-800">
                <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-gray-400" /> FAQs</div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
        </div>
    </div>
  );

  const renderSettings = () => (
      <div className="h-full bg-[#0B0F19] overflow-y-auto pb-24 animate-in slide-in-from-right">
          <Header title="Settings" onBack={() => setCurrentView('profile')} />
          <div className="p-4 space-y-6">
              {/* Account Section */}
              <section>
                  <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 px-2">Account</h3>
                  <div className="space-y-2">
                      <button onClick={() => setCurrentView('edit-profile')} className="w-full bg-[#1F2937] p-4 rounded-xl flex items-center justify-between text-white hover:bg-gray-800 active:scale-[0.99] transition-all">
                          <div className="flex items-center gap-3"><UserIcon className="w-5 h-5 text-gray-400" /> Edit Profile</div>
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                      <button onClick={() => setCurrentView('change-password')} className="w-full bg-[#1F2937] p-4 rounded-xl flex items-center justify-between text-white hover:bg-gray-800 active:scale-[0.99] transition-all">
                          <div className="flex items-center gap-3"><Lock className="w-5 h-5 text-gray-400" /> Change Password</div>
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                      <button onClick={() => setCurrentView('change-phone')} className="w-full bg-[#1F2937] p-4 rounded-xl flex items-center justify-between text-white hover:bg-gray-800 active:scale-[0.99] transition-all">
                          <div className="flex items-center gap-3"><Smartphone className="w-5 h-5 text-gray-400" /> Phone Number</div>
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                      <button onClick={() => setCurrentView('update-location')} className="w-full bg-[#1F2937] p-4 rounded-xl flex items-center justify-between text-white hover:bg-gray-800 active:scale-[0.99] transition-all">
                          <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-gray-400" /> Update Location</div>
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                  </div>
              </section>

              {/* Preferences */}
              <section>
                  <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 px-2">Preferences</h3>
                  <div className="space-y-2">
                      <button onClick={() => setCurrentView('notification-settings')} className="w-full bg-[#1F2937] p-4 rounded-xl flex items-center justify-between text-white hover:bg-gray-800 active:scale-[0.99] transition-all">
                          <div className="flex items-center gap-3"><Bell className="w-5 h-5 text-gray-400" /> Notifications</div>
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                  </div>
              </section>

              {/* About */}
              <section>
                  <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 px-2">Support</h3>
                  <button onClick={() => setCurrentView('privacy-policy')} className="w-full bg-[#1F2937] p-4 rounded-xl flex items-center justify-between text-white mb-2 hover:bg-gray-800 active:scale-[0.99]">
                      <div className="flex items-center gap-3"><Shield className="w-5 h-5 text-gray-400" /> Privacy Policy</div>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                  <button onClick={() => setCurrentView('support')} className="w-full bg-[#1F2937] p-4 rounded-xl flex items-center justify-between text-white hover:bg-gray-800 active:scale-[0.99]">
                      <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-gray-400" /> Help & Support</div>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
              </section>

              <button onClick={handleLogout} className="w-full bg-red-500/10 text-red-500 p-4 rounded-xl flex items-center justify-center font-bold hover:bg-red-500 hover:text-white transition-colors mt-6 border border-red-500/20">
                  <LogOut className="w-5 h-5 mr-2" /> Sign Out
              </button>
          </div>
      </div>
  );

  const renderProfile = () => (
      <div className="h-full bg-[#0B0F19] overflow-y-auto pb-24 animate-in fade-in">
          <div className="pt-12 px-6 pb-6 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-white">Profile</h1>
              <button onClick={() => setCurrentView('settings')} className="p-2 bg-[#1F2937] rounded-full text-gray-400 hover:text-white transition-colors active:scale-90">
                  <Settings className="w-6 h-6" />
              </button>
          </div>

          <div className="px-4 flex flex-col items-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-900 rounded-full p-1 mb-4 shadow-2xl shadow-blue-900/30">
                  <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#0B0F19]">
                      <img src={user?.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  </div>
              </div>
              <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              <span className="mt-2 px-3 py-1 bg-gray-800 text-gray-300 text-xs font-bold rounded-full uppercase tracking-wide border border-gray-700">
                  {user?.role}
              </span>
          </div>

          {/* Stats */}
          <div className="px-4 grid grid-cols-2 gap-3 mb-6">
              <div className="bg-[#1F2937] p-4 rounded-xl border border-gray-800 text-center">
                  <div className="text-2xl font-bold text-white mb-1">{user?.completedTasks}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Jobs Done</div>
              </div>
              {user?.role === UserRole.WORKER && (
                <div className="bg-[#1F2937] p-4 rounded-xl border border-gray-800 text-center">
                    <div className="text-2xl font-bold text-white mb-1">{user?.rating}</div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Rating</div>
                </div>
              )}
              {user?.role === UserRole.PROVIDER && (
                  <div className="bg-[#1F2937] p-4 rounded-xl border border-gray-800 text-center">
                      <div className="text-2xl font-bold text-white mb-1">{tasks.filter(t => t.providerId === user?.id).length}</div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Jobs Posted</div>
                  </div>
              )}
          </div>

          {/* Details */}
          <div className="px-4 space-y-4">
              <div className="bg-[#1F2937] p-4 rounded-xl border border-gray-800">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Contact Info</h3>
                  <div className="space-y-3">
                      <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Phone</span>
                          <span className="text-white text-sm">{user?.phone || 'Not set'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Location</span>
                          <span className="text-white text-sm">{user?.address || 'Not set'}</span>
                      </div>
                  </div>
              </div>

              {user?.role === UserRole.WORKER && (
                  <div className="bg-[#1F2937] p-4 rounded-xl border border-gray-800">
                      <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Skills & Experience</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                          {user?.skills?.map(skill => (
                              <span key={skill} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">{skill}</span>
                          ))}
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">{user?.bio || 'No bio added.'}</p>
                  </div>
              )}

              <button onClick={() => setCurrentView('edit-profile')} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-500 transition-colors">
                  Edit Profile
              </button>

              <button onClick={handleLogout} className="w-full bg-red-500/10 text-red-500 font-bold py-3.5 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors">
                  Sign Out
              </button>
          </div>
      </div>
  );

  const renderFullMap = () => (
      <div className="h-full w-full relative bg-[#0f172a]">
          <button onClick={() => setCurrentView('dashboard')} className="absolute top-4 left-4 z-50 bg-black/60 p-3 rounded-full text-white backdrop-blur-md active:scale-90 transition-transform"><ChevronLeft /></button>
          <MapVisualizer 
             tasks={filteredTasks} 
             userLat={workerLocation?.lat || user!.location_lat} 
             userLng={workerLocation?.lng || user!.location_lng} 
             onTaskSelect={(t) => { setSelectedTask(t); setCurrentView('job-details'); }}
             onUpdateLocation={() => setWorkerLocation({lat: user!.location_lat, lng: user!.location_lng})}
             showUserLocation={true}
             isTrackingMode={isTracking}
          />
      </div>
  );

  const renderWorkerRoute = () => (
    <div className="h-full w-full relative bg-[#0f172a] flex flex-col">
        {/* Map Route */}
        <div className="flex-1 relative">
             <MapVisualizer 
                tasks={[]}
                userLat={workerLocation?.lat || user!.location_lat} 
                userLng={workerLocation?.lng || user!.location_lng}
                destinationLat={selectedTask?.location_lat}
                destinationLng={selectedTask?.location_lng}
                activeTask={selectedTask}
                showRoute={true}
                showUserLocation={true}
                isTrackingMode={true}
             />
             <div className="absolute top-4 left-4 z-50">
                <button onClick={() => setCurrentView('job-details')} className="bg-black/60 p-2 rounded-full text-white backdrop-blur-md active:scale-90 border border-white/10">
                    <ChevronLeft />
                </button>
             </div>
        </div>
        
        {/* Navigation Sheet */}
        <div className="bg-[#0B0F19] border-t border-gray-800 p-5 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50">
             <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-4"></div>
             
             <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white">{selectedTask?.title}</h3>
                    <p className="text-gray-400 text-sm">{selectedTask?.address}</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">{selectedTask?.distanceKm?.toFixed(1)} km</div>
                    <div className="text-xs text-gray-500">Distance</div>
                </div>
             </div>

             <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedTask?.location_lat},${selectedTask?.location_lng}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
             >
                 <NavIcon className="w-5 h-5" /> Start Navigation in Google Maps
             </a>
        </div>
    </div>
  );

  const renderProviderTracking = () => (
      <div className="h-full w-full relative bg-[#0f172a] flex flex-col">
          {/* Map Area */}
          <div className="flex-1 relative">
              <MapVisualizer 
                 tasks={[]} // Clear other tasks to focus on tracking
                 userLat={workerLocation?.lat || user!.location_lat} 
                 userLng={workerLocation?.lng || user!.location_lng}
                 destinationLat={selectedTask?.location_lat}
                 destinationLng={selectedTask?.location_lng}
                 activeTask={selectedTask}
                 showRoute={true}
                 isTrackingMode={true}
                 showUserLocation={true}
              />
              {/* Top overlay */}
              <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-start">
                  <button onClick={() => setCurrentView('dashboard')} className="bg-black/60 p-2 rounded-full text-white backdrop-blur-md active:scale-90 border border-white/10">
                       <ChevronLeft />
                  </button>
                  <div className="bg-green-600 px-4 py-1.5 rounded-full text-white text-xs font-bold shadow-lg animate-pulse">
                       Worker Live
                  </div>
              </div>
          </div>

          {/* Bottom Sheet Info */}
          <div className="bg-[#0B0F19] border-t border-gray-800 p-5 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50">
               <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-4"></div>
               <div className="flex items-center gap-4 mb-6">
                   <div className="relative">
                       <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-green-500 p-0.5">
                          <img src={selectedTask?.applicants?.find(a => a.workerId === selectedTask.workerId)?.workerPhoto || 'https://ui-avatars.com/api/?name=Worker&background=random'} alt="Worker" className="w-full h-full rounded-full object-cover" />
                       </div>
                       <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-[#0B0F19] flex items-center justify-center">
                           <MapPin className="w-3 h-3 text-white fill-current" />
                       </div>
                   </div>
                   <div>
                       <h3 className="text-white font-bold text-lg leading-tight">
                          {selectedTask?.workerName || "Worker"}
                       </h3>
                       <p className="text-gray-400 text-sm">Arriving in <span className="text-green-400 font-bold">12 mins</span></p>
                   </div>
                   <div className="ml-auto flex gap-3">
                       <a href={`tel:${'123-456-7890'}`} className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-green-400 hover:bg-gray-700"><Phone className="w-5 h-5" /></a>
                       <button className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-blue-400 hover:bg-gray-700"><Mail className="w-5 h-5" /></button>
                   </div>
               </div>

               <div className="bg-[#1F2937] p-4 rounded-xl border border-gray-800 flex items-center justify-between mb-4">
                   <div>
                       <p className="text-xs text-gray-500 font-bold uppercase mb-1">Delivery Address</p>
                       <p className="text-white text-sm font-medium line-clamp-1">{selectedTask?.address}</p>
                   </div>
                   <div className="bg-gray-700/50 p-2 rounded-lg">
                       <MapPin className="w-5 h-5 text-gray-300" />
                   </div>
               </div>
               
               <button onClick={() => setIsTracking(false)} className="w-full bg-gray-800 text-gray-400 font-bold py-4 rounded-xl hover:bg-gray-700 hover:text-white transition-colors">
                   Stop Tracking
               </button>
          </div>
      </div>
  );

  const renderWorkerDashboard = () => (
      <div className="h-full bg-[#0B0F19] overflow-y-auto pb-24 no-scrollbar">
          {/* Header */}
          <div className="pt-12 px-6 pb-6 flex justify-between items-center bg-[#0B0F19]">
              <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-700 shadow-lg">
                       <img src={user?.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div>
                      <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">{getGreeting()}</p>
                      <h1 className="text-xl font-bold text-white">{user?.name}</h1>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <button onClick={() => setCurrentView('notifications')} className="w-10 h-10 bg-[#1F2937] rounded-full flex items-center justify-center text-gray-300 border border-gray-700 relative hover:bg-gray-700 transition-colors">
                      <Bell className="w-5 h-5" />
                      {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#1F2937]"></span>}
                  </button>
                  <button onClick={() => setCurrentView('settings')} className="w-10 h-10 bg-[#1F2937] rounded-full flex items-center justify-center text-gray-300 border border-gray-700 hover:bg-gray-700 transition-colors">
                      <Settings className="w-5 h-5" />
                  </button>
              </div>
          </div>

          {/* Worker Stats */}
          <div className="px-4 mb-6">
              <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => { setActiveTab('ONGOING'); setCurrentView('my-tasks'); }} className="bg-[#1F2937] p-3 rounded-xl border border-gray-800 flex flex-col items-center shadow-sm active:scale-95 transition-transform">
                      <Briefcase className="w-5 h-5 text-blue-400 mb-1" />
                      <span className="text-lg font-bold text-white">{myJobs.filter(t => t.status === TaskStatus.IN_PROGRESS).length}</span>
                      <span className="text-[10px] text-gray-400 uppercase">Active</span>
                  </button>
                  <button onClick={() => { setActiveTab('COMPLETED'); setCurrentView('my-tasks'); }} className="bg-[#1F2937] p-3 rounded-xl border border-gray-800 flex flex-col items-center shadow-sm active:scale-95 transition-transform">
                      <CheckCircle className="w-5 h-5 text-green-400 mb-1" />
                      <span className="text-lg font-bold text-white">{user?.completedTasks}</span>
                      <span className="text-[10px] text-gray-400 uppercase">Done</span>
                  </button>
                  <div className="bg-[#1F2937] p-3 rounded-xl border border-gray-800 flex flex-col items-center shadow-sm">
                      <Sparkles className="w-5 h-5 text-yellow-400 mb-1" />
                      <span className="text-lg font-bold text-white">{user?.rating}</span>
                      <span className="text-[10px] text-gray-400 uppercase">Rating</span>
                  </div>
              </div>
          </div>

          {/* Categories */}
          <div className="px-4 mb-4">
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                  <CategoryPill label="All" icon={Briefcase} active={activeCategory==='All'} onClick={() => setActiveCategory('All')} />
                  {Object.values(TaskCategory).map(cat => {
                      let Icon = Briefcase;
                      if (cat === TaskCategory.CLEANING) Icon = Sparkles;
                      if (cat === TaskCategory.REPAIR) Icon = Hammer;
                      if (cat === TaskCategory.SHIFTING) Icon = Truck;
                      if (cat === TaskCategory.DELIVERY) Icon = Package;
                      return <CategoryPill key={cat} label={cat} icon={Icon} active={activeCategory===cat} onClick={() => setActiveCategory(cat)} />;
                  })}
              </div>
          </div>

          {/* Map Preview */}
          <div className="px-4 mb-6 relative z-0">
              <div className="flex justify-between items-center mb-3">
                 <h3 className="text-white font-bold text-sm uppercase tracking-wide">Near You</h3>
                 <button onClick={() => setCurrentView('full-map')} className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-bold flex items-center hover:bg-blue-500/20 transition-colors">View Map <ChevronRight className="w-3 h-3 ml-1" /></button>
              </div>
              <div className="h-48 rounded-2xl overflow-hidden border border-gray-800 relative group shadow-xl">
                  <MapVisualizer 
                     tasks={filteredTasks} 
                     userLat={user!.location_lat} 
                     userLng={user!.location_lng} 
                     fixedRadius={true} // Fixes location when filtering
                     onUpdateLocation={() => {}}
                     showUserLocation={true}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent pointer-events-none"></div>
              </div>
          </div>

          {/* Jobs List */}
          <div className="px-4">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wide">Available Tasks</h3>
                  <span className="text-xs text-gray-500">{filteredTasks.length} jobs</span>
              </div>
              {filteredTasks.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 bg-[#1F2937] rounded-xl border border-dashed border-gray-700">
                      <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No jobs found nearby.</p>
                      <p className="text-xs mt-1">Try changing filters.</p>
                  </div>
              ) : (
                  filteredTasks.map(task => (
                      <TaskCard key={task.id} task={task} userRole={UserRole.WORKER} onClick={(t) => { setSelectedTask(t); setCurrentView('job-details'); }} />
                  ))
              )}
          </div>
      </div>
  );

  const renderProviderDashboard = () => {
      const myPostedTasks = tasks.filter(t => t.providerId === user?.id);
      const recentApplications = myPostedTasks.flatMap(t => 
          (t.applicants || []).filter(a => a.status === 'pending').map(a => ({...a, taskTitle: t.title, taskId: t.id}))
      );

      return (
      <div className="h-full bg-[#0B0F19] overflow-y-auto pb-24 no-scrollbar">
          {/* Provider Header */}
          <div className="pt-14 px-6 pb-6 bg-gradient-to-b from-slate-900 to-[#0B0F19] flex justify-between items-start">
              <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-600">
                      <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.name}`} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div>
                      <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">{getGreeting()}</p>
                      <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
                  </div>
              </div>
              <button onClick={() => setCurrentView('settings')} className="p-2.5 bg-[#1F2937] rounded-full text-gray-300 hover:bg-gray-700 transition-colors">
                  <Settings className="w-5 h-5" />
              </button>
          </div>

          {/* Provider Stats */}
          <div className="px-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1F2937] p-4 rounded-2xl border border-gray-800 shadow-sm">
                      <div className="text-3xl font-bold text-white mb-1">{myPostedTasks.filter(t => t.status === TaskStatus.OPEN).length}</div>
                      <p className="text-xs text-gray-400 uppercase font-bold">Active Listings</p>
                  </div>
                  <div className="bg-[#1F2937] p-4 rounded-2xl border border-gray-800 shadow-sm">
                      <div className="text-3xl font-bold text-white mb-1">{myPostedTasks.filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.ASSIGNED).length}</div>
                      <p className="text-xs text-gray-400 uppercase font-bold">Jobs In Progress</p>
                  </div>
              </div>
          </div>

          {/* Post Job Button */}
          <div className="px-4 mb-8">
              <button onClick={() => setCurrentView('post-task')} className="w-full bg-blue-600 hover:bg-blue-500 p-5 rounded-2xl flex items-center justify-between shadow-lg shadow-blue-900/20 group transition-all">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                          <h3 className="text-lg font-bold text-white">Post a New Job</h3>
                          <p className="text-blue-100 text-sm">Find help in minutes</p>
                      </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
              </button>
          </div>

          {/* Recent Applications Section */}
          <div className="px-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wide">Recent Applications</h3>
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{recentApplications.length} New</span>
              </div>
              
              {recentApplications.length === 0 ? (
                  <div className="bg-[#1F2937]/50 border border-dashed border-gray-700 rounded-xl p-6 text-center">
                      <p className="text-gray-500 text-sm">No pending applications.</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                      {recentApplications.slice(0, 3).map((app, idx) => (
                          <div key={idx} className="bg-[#1F2937] p-4 rounded-xl border border-gray-800 flex items-center gap-3" onClick={() => { 
                              const t = tasks.find(task => task.id === app.taskId);
                              if (t) { setSelectedTask(t); setCurrentView('job-details'); }
                          }}>
                               <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                                   <img src={app.workerPhoto} alt="" className="w-full h-full object-cover" />
                               </div>
                               <div className="flex-1 min-w-0">
                                   <h4 className="text-white font-bold text-sm truncate">{app.workerName}</h4>
                                   <p className="text-gray-400 text-xs truncate">Applied for: <span className="text-blue-400">{app.taskTitle}</span></p>
                               </div>
                               <button className="px-3 py-1.5 bg-blue-600/20 text-blue-400 text-xs font-bold rounded-lg">Review</button>
                          </div>
                      ))}
                  </div>
              )}
          </div>

          {/* Active Jobs List */}
          <div className="px-4">
              <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-3">Your Active Jobs</h3>
              <div className="space-y-3">
                  {myPostedTasks.length === 0 ? (
                       <div className="py-8 text-center bg-[#1F2937]/30 rounded-xl border border-gray-800">
                           <p className="text-gray-500 text-sm">You haven't posted any jobs yet.</p>
                       </div>
                  ) : (
                      myPostedTasks.map(t => (
                          <TaskCard key={t.id} task={t} userRole={UserRole.PROVIDER} onClick={(t) => { setSelectedTask(t); setCurrentView('job-details'); }} />
                      ))
                  )}
              </div>
          </div>
      </div>
      );
  };

  const renderJobDetails = () => {
      if (!selectedTask) return null;
      const isOwner = user?.role === UserRole.PROVIDER && selectedTask.providerId === user.id;
      const isApplied = selectedTask.applicants?.some(a => a.workerId === user?.id);
      // 4. Worker View Logic
      const isAssignedToMe = selectedTask.workerId === user?.id;

      return (
          <div className="h-full bg-[#0B0F19] flex flex-col relative z-50">
               {/* Map Header */}
               <div className="h-60 w-full relative shrink-0 shadow-2xl">
                   <MapVisualizer 
                      userLat={user!.location_lat} userLng={user!.location_lng}
                      destinationLat={selectedTask.location_lat} destinationLng={selectedTask.location_lng}
                      activeTask={selectedTask}
                      showRoute={isAssignedToMe || isTracking}
                      isTrackingMode={isTracking}
                      fixedRadius={false}
                   />
                   <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#0B0F19]"></div>
                   <button onClick={() => setCurrentView(isOwner ? 'dashboard' : 'my-tasks')} className="absolute top-4 left-4 bg-black/40 p-2 rounded-full text-white backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors">
                       <ChevronLeft />
                   </button>
               </div>

               {/* Scrollable Details */}
               <div className="flex-1 overflow-y-auto -mt-6 px-5 pb-32 relative z-10 rounded-t-3xl bg-[#0B0F19]">
                   {/* Header Info */}
                   <div className="flex justify-between items-start mb-4 pt-4">
                       <div>
                           <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded mb-2 uppercase tracking-wider border ${selectedTask.category === TaskCategory.CLEANING ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                               {selectedTask.category}
                           </span>
                           <h1 className="text-2xl font-bold text-white leading-tight">{selectedTask.title}</h1>
                       </div>
                       <div className="text-right">
                            <div className="text-2xl font-bold text-green-400">${selectedTask.budget}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Fixed Price</div>
                       </div>
                   </div>

                   {/* 5. Hired State: Show Provider Info */}
                   {!isOwner && (
                       <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between shadow-sm ${isAssignedToMe ? 'bg-green-500/10 border-green-500/30' : 'bg-[#1F2937] border-gray-800'}`}>
                           {isAssignedToMe && (
                               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                                   YOU ARE HIRED
                               </div>
                           )}
                           <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center font-bold text-white overflow-hidden">
                                   {selectedTask.providerPhoto ? <img src={selectedTask.providerPhoto} className="w-full h-full object-cover" /> : selectedTask.providerName.charAt(0)}
                               </div>
                               <div>
                                   <p className="text-white font-bold text-sm">{selectedTask.providerName}</p>
                                   <p className="text-gray-500 text-[10px] uppercase tracking-wide">Job Poster</p>
                               </div>
                           </div>
                           
                           {isAssignedToMe ? (
                               <a href={`tel:${selectedTask.providerPhone}`} className="p-2 bg-green-600 text-white rounded-full hover:bg-green-500 shadow-lg animate-pulse">
                                   <Phone className="w-5 h-5" />
                               </a>
                           ) : (
                               <button className="p-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"><Mail className="w-4 h-4" /></button>
                           )}
                       </div>
                   )}

                   {/* Info Cards */}
                   <div className="space-y-3 mb-6">
                       <div className="bg-[#1F2937] p-4 rounded-xl border border-gray-800">
                           <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Date & Time</h3>
                           <p className="text-white font-bold text-sm">{selectedTask.date || 'ASAP'}</p>
                       </div>

                       <div className="bg-[#1F2937] p-4 rounded-xl border border-gray-800">
                           <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</h3>
                                    <p className="text-white font-bold text-sm">{selectedTask.address}</p>
                                </div>
                                <button onClick={() => setCurrentView('full-map')} className="bg-blue-500/10 text-blue-400 p-2 rounded-lg hover:bg-blue-500/20"><NavIcon className="w-4 h-4" /></button>
                           </div>
                       </div>

                       <div className="bg-[#1F2937] p-4 rounded-xl border border-gray-800">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Description</h3>
                            <p className="text-gray-300 text-sm leading-relaxed">{selectedTask.description}</p>
                       </div>
                       
                       {selectedTask.skills && (
                           <div className="bg-[#1F2937] p-4 rounded-xl border border-gray-800">
                                <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Required Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTask.skills.map(s => (
                                        <span key={s} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">{s}</span>
                                    ))}
                                </div>
                           </div>
                       )}
                   </div>
                   
                   {/* Provider: Applicants List */}
                   {isOwner && (
                       <div className="mb-6">
                           <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-wide border-b border-gray-800 pb-2">Applicants ({selectedTask.applicants?.length || 0})</h3>
                           {selectedTask.applicants?.length === 0 ? <p className="text-gray-500 text-sm italic">No workers applied yet.</p> : 
                             selectedTask.applicants?.map(app => (
                                 <div key={app.workerId} className="bg-[#1F2937] p-4 rounded-xl mb-3 border border-gray-700">
                                     <div className="flex items-center justify-between mb-3">
                                         <div className="flex items-center gap-3">
                                             <div className="w-10 h-10 bg-gray-600 rounded-full overflow-hidden">
                                                <img src={app.workerPhoto} alt="w" className="w-full h-full object-cover" />
                                             </div>
                                             <div>
                                                 <p className="text-white text-sm font-bold">{app.workerName}</p>
                                                 <div className="flex items-center gap-2 text-xs text-gray-400">
                                                     <span className="flex items-center text-yellow-400"><span className="mr-1">★</span>{app.workerRating}</span>
                                                     <span>• {app.distanceKm?.toFixed(1)}km away</span>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                     {app.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleProviderAction(selectedTask.id, app.workerId, 'accept')} className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">Accept</button>
                                            <button onClick={() => handleProviderAction(selectedTask.id, app.workerId, 'reject')} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">Reject</button>
                                        </div>
                                     )}
                                     {app.status === 'accepted' && <div className="text-green-400 text-xs font-bold bg-green-500/10 py-2 rounded text-center">Hired</div>}
                                 </div>
                             ))
                           }
                       </div>
                   )}
               </div>

               {/* Sticky Footer Button */}
               <div className="fixed bottom-0 left-0 w-full p-4 bg-[#0B0F19]/95 backdrop-blur-md border-t border-gray-800 z-50 pb-[env(safe-area-inset-bottom)]">
                   {!isOwner ? (
                       // Worker Actions
                       isAssignedToMe ? (
                           <div className="flex gap-3">
                               <a href={`tel:${selectedTask.providerPhone}`} className="flex-1 bg-[#1F2937] text-white font-bold py-4 rounded-xl border border-gray-700 flex items-center justify-center gap-2">
                                   <PhoneCall className="w-5 h-5" /> Call
                               </a>
                               <button 
                                   onClick={() => setCurrentView('worker-route')}
                                   className="flex-[2] bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-blue-500"
                               >
                                   <NavIcon className="w-5 h-5" /> Get Directions
                               </button>
                           </div>
                       ) : (
                           <button 
                               onClick={() => !isApplied && handleAcceptTask(selectedTask)} 
                               disabled={isApplied}
                               className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] ${isApplied ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/30'}`}
                           >
                               {isApplied ? 'Task Applied' : 'Accept Task'}
                           </button>
                       )
                   ) : (
                       // Provider Footer Action
                       selectedTask.status === TaskStatus.ASSIGNED || selectedTask.status === TaskStatus.IN_PROGRESS ? (
                           <button 
                              onClick={() => { setIsTracking(true); setCurrentView('provider-tracking'); }} 
                              className="w-full font-bold py-4 rounded-xl shadow-lg bg-green-600 text-white hover:bg-green-500 flex items-center justify-center gap-2"
                           >
                              <MapPin className="w-5 h-5" /> Track Worker Live
                           </button>
                       ) : (
                           <div className="text-center text-gray-500 text-sm font-medium py-2">
                               Waiting for worker...
                           </div>
                       )
                   )}
               </div>
          </div>
      );
  };

  const renderPostTask = () => (
    <div className="h-full bg-[#0B0F19] flex flex-col pb-24">
        <Header title="Post a Job" onBack={() => setCurrentView('dashboard')} />
        
        <div className="flex-1 p-4 overflow-y-auto">
           {/* AI Input Section */}
           {!isEditingJob ? (
               <div className="flex flex-col h-full justify-center animate-in fade-in">
                  <div className="bg-[#1F2937] p-6 rounded-2xl border border-gray-800 mb-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 relative z-10"><Sparkles className="w-6 h-6 text-blue-400" /></div>
                      <h2 className="text-xl font-bold text-white mb-2 relative z-10">AI Assistant</h2>
                      <p className="text-gray-400 text-sm relative z-10">Describe your task naturally. Our AI will fill out all the details for you.</p>
                  </div>
                  <textarea 
                      className="w-full h-40 bg-[#111827] border border-gray-700 rounded-xl p-4 text-white mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                      placeholder="e.g., I need someone to clean my 2-bedroom apartment this Saturday morning. Willing to pay $80. Need them to bring supplies."
                      value={taskPrompt}
                      onChange={(e) => setTaskPrompt(e.target.value)}
                  />
                  <button 
                      onClick={handleAnalyzeTask}
                      disabled={!taskPrompt.trim() || isAnalyzing}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-900/30 transition-transform active:scale-[0.99]"
                  >
                      {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Job Details'}
                  </button>
               </div>
           ) : (
               <div className="animate-in slide-in-from-bottom-10 fade-in duration-300">
                   <div className="flex justify-between items-center mb-6 bg-[#1F2937] p-4 rounded-xl border border-gray-800">
                       <h2 className="text-lg font-bold text-white">Review & Edit</h2>
                       <button onClick={() => setIsEditingJob(false)} className="text-xs text-blue-400 hover:underline font-bold flex items-center gap-1">
                           <Edit3 className="w-3 h-3" /> Edit Details
                       </button>
                   </div>

                   <div className="space-y-4 mb-8">
                       <InputField label="Job Title" value={analyzedTask!.title} onChange={(e:any) => setAnalyzedTask({...analyzedTask!, title: e.target.value})} type="text" />
                       
                       <InputField label="Description" multiline value={analyzedTask!.description} onChange={(e:any) => setAnalyzedTask({...analyzedTask!, description: e.target.value})} />

                       <div className="grid grid-cols-2 gap-4">
                           <InputField label="Budget ($)" type="number" value={analyzedTask!.budget} onChange={(e:any) => setAnalyzedTask({...analyzedTask!, budget: Number(e.target.value)})} />
                           <div>
                               <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Category</label>
                               <select value={analyzedTask!.category} onChange={(e:any) => setAnalyzedTask({...analyzedTask!, category: e.target.value})} className="w-full bg-[#1F2937] text-white text-sm border border-gray-700 rounded-xl p-3.5 focus:outline-none h-[50px]">
                                   {Object.values(TaskCategory).map(c => <option key={c} value={c}>{c}</option>)}
                               </select>
                           </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                           <InputField label="Date" type="text" value={analyzedTask!.date || ''} onChange={(e:any) => setAnalyzedTask({...analyzedTask!, date: e.target.value})} />
                           <InputField label="Location" type="text" value={analyzedTask!.locationText || ''} onChange={(e:any) => setAnalyzedTask({...analyzedTask!, locationText: e.target.value})} />
                       </div>
                       
                       <div>
                           <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Skills (comma separated)</label>
                           <input 
                               type="text"
                               className="w-full bg-[#1F2937] border border-gray-700 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                               value={analyzedTask!.skills?.join(', ')} 
                               onChange={(e) => setAnalyzedTask({...analyzedTask!, skills: e.target.value.split(',').map(s=>s.trim())})} 
                           />
                       </div>
                   </div>
                   
                   <div className="flex gap-3">
                      <button onClick={() => setIsEditingJob(false)} className="flex-1 bg-[#1F2937] text-white font-bold py-3.5 rounded-xl border border-gray-700 hover:bg-gray-800">Cancel</button>
                      <button onClick={handlePostTask} className="flex-[2] bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/30 hover:bg-blue-500">Confirm & Post</button>
                   </div>
               </div>
           )}
        </div>
    </div>
  );

  const renderMyTasks = () => (
    <div className="h-full bg-[#0B0F19] flex flex-col pb-24">
        <Header title="My Jobs" onBack={() => setCurrentView('dashboard')} />
        
        <div className="px-4 pt-2 pb-4 sticky top-[73px] bg-[#0B0F19] z-40">
            <div className="flex p-1 bg-[#1F2937] rounded-xl">
                {['ASSIGNED', 'ONGOING', 'COMPLETED'].map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wide ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
            {myJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <div className="w-16 h-16 bg-[#1F2937] rounded-full flex items-center justify-center mb-4">
                        <Briefcase className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-sm font-bold text-gray-300">No tasks found.</p>
                    <p className="text-xs mt-1">Check back later for new opportunities.</p>
                </div>
            ) : (
                myJobs.map(task => (
                    <TaskCard key={task.id} task={task} userRole={user?.role || UserRole.WORKER} onClick={(t) => { setSelectedTask(t); setCurrentView('job-details'); }} />
                ))
            )}
        </div>
    </div>
  );

  if (!user) return <AuthFlow onComplete={setUser} />;

  return (
      <div className="h-screen w-screen bg-[#0B0F19] text-white overflow-hidden font-sans">
          {toast && <Toast message={toast.msg} type={toast.type} />}
          
          {currentView === 'dashboard' && user.role === UserRole.WORKER && renderWorkerDashboard()}
          {currentView === 'dashboard' && user.role === UserRole.PROVIDER && renderProviderDashboard()}
          {currentView === 'job-details' && renderJobDetails()}
          {currentView === 'post-task' && renderPostTask()}
          {currentView === 'settings' && renderSettings()}
          {currentView === 'profile' && renderProfile()}
          {currentView === 'notifications' && renderNotifications()}
          {currentView === 'full-map' && renderFullMap()}
          {currentView === 'worker-route' && renderWorkerRoute()}
          {currentView === 'my-tasks' && renderMyTasks()}
          {currentView === 'provider-active' && renderMyTasks()} 
          {currentView === 'provider-tracking' && renderProviderTracking()}

          {/* Settings Sub-pages */}
          {currentView === 'edit-profile' && renderEditProfile()}
          {currentView === 'change-password' && renderChangePassword()}
          {currentView === 'change-phone' && renderChangePhone()}
          {currentView === 'update-location' && renderUpdateLocation()}
          {currentView === 'notification-settings' && renderNotificationSettings()}
          {currentView === 'privacy-policy' && renderPrivacyPolicy()}
          {currentView === 'support' && renderSupport()}
          
          {/* Navigation - Only show on main tabs */}
          {['dashboard', 'profile', 'my-tasks', 'provider-active', 'post-task'].includes(currentView) && (
             <Navigation role={user.role} currentView={currentView} onChangeView={setCurrentView} onLogout={handleLogout} />
          )}
      </div>
  );
};

export default App;
