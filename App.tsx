
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, Task, TaskStatus, TaskCategory } from './types';
import { INITIAL_TASKS, generateRandomCoordinates } from './services/mockData';
import { analyzeTaskDescription } from './services/geminiService';
import { signInWithGoogle, isConfigured, auth, storage } from './services/authService';
import Navigation from './components/Navigation';
import TaskCard from './components/TaskCard';
import MapVisualizer from './components/MapVisualizer';
import { 
  Sparkles, Loader2, MapPin, CheckCircle, Star, ShieldCheck, 
  ChevronLeft, Briefcase, Lock, Mail, Phone, User as UserIcon, 
  Search, ChevronRight, ChevronDown, Building, Hammer, Navigation as NavIcon, Crosshair,
  Eye, EyeOff, ExternalLink, Copy, AlertTriangle, TrendingUp, Zap, Filter,
  Settings, Key, Smartphone, Bell, FileText, LogOut, Camera, Save, ToggleLeft, ToggleRight, X, Trash2,
  Edit3, Plus, Award, Briefcase as WorkIcon, PlusCircle, Car, Clock, RefreshCw
} from 'lucide-react';

// --- Utilities ---

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
};

const deg2rad = (deg: number) => deg * (Math.PI/180);
const isValidPhone = (phone: string) => /^\d{10}$/.test(phone);
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = (pwd: string) => /^(?=.*[0-9])(?=.*[a-zA-Z])(?!.*\s).{6,}$/.test(pwd);

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 49.299 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
    </g>
  </svg>
);

// --- Components ---

const Toast = ({ message, type, onClose }: { message: string, type: 'success'|'error', onClose: () => void }) => (
  <div className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
    {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
    <span className="text-sm font-bold">{message}</span>
  </div>
);

const InputField = ({ icon: Icon, type, placeholder, value, onChange, label, error }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="mb-4 w-full">
      {label && <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>}
      <div className="relative">
        {Icon && <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Icon className="h-5 w-5 text-gray-500" /></div>}
        <input
          type={inputType}
          className={`w-full bg-[#1F2937] border ${error ? 'border-red-500' : 'border-gray-700'} text-white rounded-xl py-4 ${Icon ? 'pl-11' : 'pl-4'} ${isPassword ? 'pr-12' : 'pr-4'} focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-blue-500'} transition-all`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white">
            {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
    </div>
  );
};

const SettingsItem = ({ icon: Icon, label, onClick, danger }: { icon: any, label: string, onClick: () => void, danger?: boolean }) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-[#1F2937] rounded-xl border border-gray-800 hover:border-blue-500/50 group transition-all active:scale-[0.98]">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${danger ? 'bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white' : 'bg-gray-800 text-gray-400 group-hover:bg-blue-500 group-hover:text-white'}`}>
                <Icon className="w-5 h-5" />
            </div>
            <span className={`font-medium ${danger ? 'text-gray-200 group-hover:text-red-400' : 'text-gray-200'}`}>{label}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
    </button>
);

// --- Auth State Machine ---
const AuthFlow: React.FC<{ onComplete: (user: User) => void }> = ({ onComplete }) => {
  const [step, setStep] = useState<'login' | 'signup' | 'role' | 'location'>('login');
  const [formData, setFormData] = useState<any>({ phone: '', email: '', password: '', name: '', role: UserRole.WORKER, location_lat: 0, location_lng: 0, skills: [] });
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    if (!isConfigured) { setGoogleError("App Config Missing"); return; }
    setIsLoading(true); setGoogleError(null);
    try {
      const result = await signInWithGoogle();
      if (result.isNewUser) {
        setFormData({ ...formData, name: result.user.name || '', email: result.user.email || '', photoURL: result.user.photoURL });
        setStep('role');
      } else {
        onComplete({
          id: result.user.id!, name: result.user.name!, email: result.user.email!, role: UserRole.WORKER, phone: '0000000000',
          location_lat: 40.7128, location_lng: -74.0060, address: 'New York, NY', rating: 5.0, completedTasks: 0, photoURL: result.user.photoURL
        });
      }
    } catch (err: any) { setGoogleError(err.message); } finally { setIsLoading(false); }
  };

  if (step === 'login') {
    return (
      <div className="h-full w-full flex flex-col bg-[#0B0F19] p-6 pt-safe-top overflow-y-auto">
         <div className="flex flex-col items-center justify-center flex-1 min-h-min">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-900/20">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">WorkLink</h1>
          <p className="text-gray-400 mb-8">Connect. Work. Earn.</p>
          
          <InputField icon={Mail} type="email" placeholder="Email" value={formData.email} onChange={(e:any) => setFormData({...formData, email: e.target.value})} error={errors.email} />
          <InputField icon={Lock} type="password" placeholder="Password" value={formData.password} onChange={(e:any) => setFormData({...formData, password: e.target.value})} error={errors.password} />
          <button onClick={() => { if(isValidEmail(formData.email) && formData.password) onComplete({id: 'demo', name: 'Demo User', email: formData.email, role: UserRole.WORKER, phone:'999', location_lat: 40.7128, location_lng: -74.0060, address: 'NY', rating: 4.8, completedTasks: 12}); else setErrors({email: 'Invalid credentials'}) }} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 shadow-lg">Log In</button>
          
          <div className="relative w-full my-8"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0B0F19] px-2 text-gray-500">Or</span></div></div>
          <button onClick={handleGoogleLogin} disabled={isLoading} className="w-full bg-white text-gray-900 font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100">{isLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon /><span>Continue with Google</span></>}</button>
          {googleError && <p className="text-red-500 text-xs text-center mt-2">{googleError}</p>}
          <p className="mt-8 text-gray-400 text-sm">Don't have an account? <button onClick={() => setStep('signup')} className="text-blue-400 font-bold ml-1">Sign Up</button></p>
         </div>
      </div>
    );
  }

  if (step === 'signup') {
    return (
      <div className="h-full w-full flex flex-col bg-[#0B0F19] p-6 pt-safe-top overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center min-h-min">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-6">
            <UserIcon className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>
          
          <InputField icon={UserIcon} type="text" placeholder="Full Name" value={formData.name} onChange={(e:any) => setFormData({...formData, name: e.target.value})} />
          
          <InputField icon={Phone} type="tel" placeholder="Phone Number (10 digits)" value={formData.phone} onChange={(e:any) => {
             const val = e.target.value.replace(/\D/g,'').slice(0,10);
             setFormData({...formData, phone: val});
          }} error={errors.phone} />
          
          <InputField icon={Mail} type="email" placeholder="Email" value={formData.email} onChange={(e:any) => setFormData({...formData, email: e.target.value})} error={errors.email} />
          
          <InputField icon={Lock} type="password" placeholder="Password (min 6 chars)" value={formData.password} onChange={(e:any) => setFormData({...formData, password: e.target.value})} error={errors.password} />

          <button onClick={() => {
            const newErrors: any = {};
            if (!formData.name) newErrors.name = "Name is required";
            if (!isValidPhone(formData.phone)) newErrors.phone = "Enter valid 10-digit number";
            if (!isValidEmail(formData.email)) newErrors.email = "Enter valid email";
            if (!isValidPassword(formData.password)) newErrors.password = "Password too weak (needs letter, number, 6+ chars)";
            
            if (Object.keys(newErrors).length > 0) {
              setErrors(newErrors);
            } else {
              setStep('role');
            }
          }} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 shadow-lg transition-all active:scale-95">
            Continue
          </button>

          <p className="mt-8 text-gray-400 text-sm">
            Already have an account? <button onClick={() => setStep('login')} className="text-blue-400 font-bold ml-1">Log In</button>
          </p>
        </div>
      </div>
    );
  }

  if (step === 'role') {
    return (
      <div className="h-full w-full flex flex-col bg-[#0B0F19] p-6 pt-safe-top">
        <button onClick={() => setStep('login')} className="mb-6 text-gray-400 hover:text-white"><ChevronLeft /></button>
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Role</h2>
        <p className="text-gray-400 mb-8">How do you want to use WorkLink?</p>

        <div className="grid grid-cols-1 gap-4">
          <button onClick={() => setFormData({...formData, role: UserRole.PROVIDER})} className={`p-8 rounded-2xl border text-left transition-all ${formData.role === UserRole.PROVIDER ? 'bg-blue-600/20 border-blue-500 scale-[1.02]' : 'bg-[#1F2937] border-gray-700 hover:bg-gray-800'}`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${formData.role === UserRole.PROVIDER ? 'bg-blue-500' : 'bg-gray-700'}`}>
              <Building className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Provider</h3>
            <p className="text-gray-400 text-sm mt-2">Post jobs and hire workers for your tasks</p>
          </button>

          <button onClick={() => setFormData({...formData, role: UserRole.WORKER})} className={`p-8 rounded-2xl border text-left transition-all ${formData.role === UserRole.WORKER ? 'bg-green-600/20 border-green-500 scale-[1.02]' : 'bg-[#1F2937] border-gray-700 hover:bg-gray-800'}`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${formData.role === UserRole.WORKER ? 'bg-green-500' : 'bg-gray-700'}`}>
              <Hammer className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Worker</h3>
            <p className="text-gray-400 text-sm mt-2">Find nearby jobs and earn money</p>
          </button>
        </div>

        <button onClick={() => setStep('location')} className="w-full bg-white text-black font-bold py-4 rounded-xl mt-auto mb-4 shadow-lg">
          Continue
        </button>
      </div>
    );
  }

  if (step === 'location') {
    return (
       <div className="h-full w-full flex flex-col bg-[#0B0F19] p-6 pt-safe-top">
         <button onClick={() => setStep('role')} className="mb-6 text-gray-400 hover:text-white"><ChevronLeft /></button>
         <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <MapPin className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Enable Location</h2>
            <p className="text-gray-400 text-center mb-8">We need your location to find tasks or workers near you.</p>

            <button onClick={() => {
               if (navigator.geolocation) {
                 navigator.geolocation.getCurrentPosition(
                   (pos) => {
                     onComplete({
                       id: 'new_user_' + Date.now(),
                       name: formData.name,
                       email: formData.email,
                       phone: formData.phone,
                       role: formData.role,
                       location_lat: pos.coords.latitude,
                       location_lng: pos.coords.longitude,
                       address: "Detected Location",
                       rating: 5.0,
                       completedTasks: 0,
                       skills: formData.role === UserRole.WORKER ? ['Helper'] : undefined,
                       photoURL: formData.photoURL
                     });
                   },
                   (err) => {
                     console.error(err);
                     // Fallback mock location
                      onComplete({
                       id: 'new_user_' + Date.now(),
                       name: formData.name,
                       email: formData.email,
                       phone: formData.phone,
                       role: formData.role,
                       location_lat: 40.7128,
                       location_lng: -74.0060,
                       address: "Manual Location",
                       rating: 5.0,
                       completedTasks: 0,
                       skills: formData.role === UserRole.WORKER ? ['Helper'] : undefined,
                       photoURL: formData.photoURL
                     });
                   }
                 );
               }
            }} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
              <NavIcon className="w-5 h-5" /> Use Current Location
            </button>
            
            <button onClick={() => {
               // Manual fallback
               onComplete({
                 id: 'new_user_' + Date.now(),
                 name: formData.name,
                 email: formData.email,
                 phone: formData.phone,
                 role: formData.role,
                 location_lat: 40.7128,
                 location_lng: -74.0060,
                 address: "Default NY",
                 rating: 5.0,
                 completedTasks: 0,
                 skills: formData.role === UserRole.WORKER ? ['Helper'] : undefined,
                 photoURL: formData.photoURL
               });
            }} className="mt-4 text-gray-500 text-sm underline">Enter Manually</button>
         </div>
       </div>
    );
  }

  return null;
};

// --- Settings Screen Components ---

const EditProfileScreen = ({ user, setUser, setCurrentView, showToast }: any) => {
    const [editForm, setEditForm] = useState({
        name: user?.name || '',
        bio: user?.bio || '',
        photoURL: user?.photoURL || ''
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditForm({ ...editForm, photoURL: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="bg-[#0B0F19] min-h-full flex flex-col pb-20">
             <div className="p-4 pt-safe-top flex items-center gap-4 sticky top-0 z-10 bg-[#0B0F19]/90 backdrop-blur-md border-b border-gray-800">
                  <button onClick={() => setCurrentView('settings')} className="text-white bg-[#1F2937] p-2 rounded-full"><ChevronLeft /></button>
                  <h2 className="text-lg font-bold text-white">Edit Profile</h2>
             </div>
             
             <div className="p-6 space-y-6">
                <div className="flex justify-center">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-blue-500 overflow-hidden">
                            {editForm.photoURL ? (
                                <img src={editForm.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white bg-blue-600">{user?.name.charAt(0)}</div>
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white shadow-lg cursor-pointer hover:bg-blue-500 transition-colors">
                            <Camera className="w-4 h-4" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                   <InputField label="Full Name" value={editForm.name} onChange={(e:any) => setEditForm({...editForm, name: e.target.value})} />
                   
                   {user?.role === UserRole.WORKER && (
                     <>
                        <div className="mb-4">
                           <label className="block text-sm font-medium text-gray-300 mb-2">Bio / Short Description</label>
                           <textarea 
                              className="w-full bg-[#1F2937] border border-gray-700 rounded-xl p-3 text-white h-24 resize-none focus:border-blue-500 outline-none"
                              value={editForm.bio}
                              onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                              placeholder="Tell providers about yourself..."
                           />
                        </div>
                     </>
                   )}
                </div>

                <button 
                   onClick={() => {
                       setUser({ ...user!, name: editForm.name, bio: editForm.bio, photoURL: editForm.photoURL });
                       showToast('Profile Updated Successfully');
                       setCurrentView('settings');
                   }}
                   className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg"
                >
                    Save Changes
                </button>
             </div>
        </div>
    );
};

const WorkerExperienceScreen = ({ user, setUser, setCurrentView, showToast }: any) => {
    const [form, setForm] = useState({
        experience: user?.experienceYears || 0,
        skills: user?.skills || [],
        newSkill: ''
    });

    const addSkill = () => {
        if (form.newSkill && !form.skills.includes(form.newSkill)) {
            setForm({ ...form, skills: [...form.skills, form.newSkill], newSkill: '' });
        }
    };

    const removeSkill = (skill: string) => {
        setForm({ ...form, skills: form.skills.filter((s: string) => s !== skill) });
    };

    return (
        <div className="bg-[#0B0F19] min-h-full flex flex-col pb-20">
             <div className="p-4 pt-safe-top flex items-center gap-4 sticky top-0 z-10 bg-[#0B0F19]/90 backdrop-blur-md border-b border-gray-800">
                  <button onClick={() => setCurrentView('profile')} className="text-white bg-[#1F2937] p-2 rounded-full"><ChevronLeft /></button>
                  <h2 className="text-lg font-bold text-white">Experience & Skills</h2>
             </div>
             
             <div className="p-6 space-y-8">
                 {/* Experience */}
                 <div>
                     <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-500" /> Work Experience</h3>
                     <InputField label="Years of Experience" type="number" value={form.experience} onChange={(e:any) => setForm({...form, experience: Number(e.target.value)})} />
                 </div>

                 {/* Skills */}
                 <div>
                     <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-purple-500" /> Skills</h3>
                     <div className="flex gap-2 mb-4">
                         <input 
                           type="text" 
                           className="flex-1 bg-[#1F2937] border border-gray-700 rounded-xl p-3 text-white focus:outline-none"
                           placeholder="Add a skill (e.g. Plumber)"
                           value={form.newSkill}
                           onChange={(e) => setForm({...form, newSkill: e.target.value})}
                         />
                         <button onClick={addSkill} className="bg-blue-600 text-white p-3 rounded-xl font-bold"><Plus /></button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                         {form.skills.map((skill: string) => (
                             <span key={skill} className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 border border-gray-700">
                                 {skill}
                                 <button onClick={() => removeSkill(skill)} className="text-gray-500 hover:text-white"><X className="w-3 h-3" /></button>
                             </span>
                         ))}
                     </div>
                 </div>

                 <button 
                    onClick={() => {
                        setUser({ ...user!, experienceYears: form.experience, skills: form.skills });
                        showToast('Experience & Skills Updated');
                        setCurrentView('profile');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg mt-8"
                 >
                     Save Changes
                 </button>
             </div>
        </div>
    );
};

const ProfileScreen = ({ user, setUser, setCurrentView, handleLogout }: any) => {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    return (
        <div className="bg-[#0B0F19] min-h-full flex flex-col pb-24">
            {/* Header */}
            <div className="bg-gradient-to-b from-[#1F2937] to-[#0B0F19] p-6 pt-safe-top rounded-b-[32px] shadow-2xl border-b border-gray-800/50">
                <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                         <div className="w-24 h-24 rounded-full bg-gray-700 border-4 border-[#0B0F19] shadow-xl overflow-hidden">
                             {user?.photoURL ? (
                                 <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white bg-blue-600">{user?.name.charAt(0)}</div>
                             )}
                         </div>
                         <button onClick={() => setCurrentView('settings-edit-profile')} className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-400 transition-colors">
                             <Edit3 className="w-4 h-4" />
                         </button>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">{user?.name}</h1>
                    <p className="text-gray-400 text-sm flex items-center gap-1 mb-4">
                        {user?.role === UserRole.WORKER ? <Hammer className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                        {user?.role === UserRole.WORKER ? 'Worker Account' : 'Provider Account'}
                    </p>
                    
                    {user?.role === UserRole.WORKER && (
                        <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20">
                             <Star className="w-4 h-4 fill-current" />
                             <span className="font-bold">{user?.rating || 'New'}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-6 mt-6 space-y-6">
                {/* Contact Info Card */}
                <div className="bg-[#1F2937] p-4 rounded-2xl border border-gray-800 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Contact Info</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-gray-300">
                            <Mail className="w-4 h-4 text-gray-500" /> {user?.email}
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                            <Phone className="w-4 h-4 text-gray-500" /> {user?.phone || 'Not set'}
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                            <MapPin className="w-4 h-4 text-gray-500" /> {user?.address || 'Location not set'}
                        </div>
                    </div>
                </div>

                {/* Worker Specifics */}
                {user?.role === UserRole.WORKER && (
                    <>
                        <div className="bg-[#1F2937] p-4 rounded-2xl border border-gray-800 shadow-sm">
                             <div className="flex justify-between items-start mb-3">
                                 <h3 className="text-xs font-bold text-gray-500 uppercase">Skills & Experience</h3>
                                 <button onClick={() => setCurrentView('profile-experience')} className="text-blue-400 text-xs font-bold">Edit</button>
                             </div>
                             <div className="flex flex-wrap gap-2 mb-3">
                                 {user?.skills?.map((s: string) => (
                                     <span key={s} className="bg-gray-800 text-gray-300 px-2 py-1 rounded-lg text-xs border border-gray-700">{s}</span>
                                 ))}
                                 {!user?.skills?.length && <span className="text-gray-500 text-xs italic">No skills added yet.</span>}
                             </div>
                             <div className="flex items-center gap-2 text-sm text-gray-300">
                                 <Briefcase className="w-4 h-4 text-gray-500" />
                                 {user?.experienceYears ? `${user.experienceYears} Years Experience` : 'No experience listed'}
                             </div>
                        </div>

                        <div className="bg-[#1F2937] p-4 rounded-2xl border border-gray-800 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">About Me</h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {user?.bio || "No bio added yet. Tap 'Edit Profile' to add one."}
                            </p>
                        </div>

                        <div className="bg-[#1F2937] p-4 rounded-2xl border border-gray-800 shadow-sm flex items-center justify-between">
                             <span className="text-gray-300 font-medium">Completed Jobs</span>
                             <span className="text-xl font-bold text-white">{user?.completedTasks || 0}</span>
                        </div>
                    </>
                )}

                {/* Provider Specifics */}
                {user?.role === UserRole.PROVIDER && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#1F2937] p-4 rounded-2xl border border-gray-800 shadow-sm flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-white mb-1">12</span>
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Jobs Posted</span>
                        </div>
                        <div className="bg-[#1F2937] p-4 rounded-2xl border border-gray-800 shadow-sm flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-white mb-1">8</span>
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Workers Hired</span>
                        </div>
                        <button onClick={() => setCurrentView('post-task')} className="col-span-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                            <PlusCircle className="w-4 h-4" /> Post New Job Shortcut
                        </button>
                    </div>
                )}

                {/* Menu Buttons */}
                <div className="space-y-2 pt-4">
                    <SettingsItem icon={UserIcon} label="Edit Profile" onClick={() => setCurrentView('settings-edit-profile')} />
                    <SettingsItem icon={Settings} label="Settings" onClick={() => setCurrentView('settings')} />
                    
                    <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center justify-between p-4 bg-[#1F2937] rounded-xl border border-gray-800 hover:border-red-500/50 group transition-all active:scale-[0.98] mt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-lg text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                <LogOut className="w-5 h-5" />
                            </div>
                            <span className="text-gray-200 font-medium group-hover:text-red-400">Log Out</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1F2937] rounded-2xl p-6 max-w-sm w-full border border-gray-800 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-white mb-2">Log Out?</h3>
                        <p className="text-gray-400 mb-6">Are you sure you want to log out of WorkLink?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-700">Cancel</button>
                            <button onClick={handleLogout} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-500">Log Out</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ChangePasswordScreen = ({ setCurrentView, showToast }: any) => {
    const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
    
    return (
      <div className="bg-[#0B0F19] min-h-full flex flex-col">
           <div className="p-4 pt-safe-top flex items-center gap-4 sticky top-0 z-10 bg-[#0B0F19]/90 backdrop-blur-md border-b border-gray-800">
                <button onClick={() => setCurrentView('settings')} className="text-white bg-[#1F2937] p-2 rounded-full"><ChevronLeft /></button>
                <h2 className="text-lg font-bold text-white">Change Password</h2>
           </div>
           <div className="p-6 space-y-4">
               <InputField type="password" label="Current Password" value={pwForm.current} onChange={(e:any) => setPwForm({...pwForm, current: e.target.value})} />
               <InputField type="password" label="New Password" value={pwForm.new} onChange={(e:any) => setPwForm({...pwForm, new: e.target.value})} />
               <InputField type="password" label="Confirm New Password" value={pwForm.confirm} onChange={(e:any) => setPwForm({...pwForm, confirm: e.target.value})} />
               
               <button 
                 onClick={() => {
                     if (!pwForm.current || !pwForm.new) return showToast("Please fill all fields", "error");
                     if (pwForm.new !== pwForm.confirm) return showToast("Passwords do not match", "error");
                     if (pwForm.new.length < 6) return showToast("Password too short", "error");
                     showToast("Password Updated Successfully");
                     setCurrentView('settings');
                 }}
                 className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg mt-4"
              >
                  Update Password
              </button>
           </div>
      </div>
    );
};

const ChangePhoneScreen = ({ setCurrentView, showToast }: any) => (
  <div className="bg-[#0B0F19] min-h-full flex flex-col">
       <div className="p-4 pt-safe-top flex items-center gap-4 sticky top-0 z-10 bg-[#0B0F19]/90 backdrop-blur-md border-b border-gray-800">
            <button onClick={() => setCurrentView('settings')} className="text-white bg-[#1F2937] p-2 rounded-full"><ChevronLeft /></button>
            <h2 className="text-lg font-bold text-white">Change Phone Number</h2>
       </div>
       <div className="p-6">
           <p className="text-gray-400 text-sm mb-6">We will send a verification code to the new number.</p>
           <InputField icon={Smartphone} label="New Phone Number" placeholder="10-digit number" value="" onChange={() => {}} />
           <button onClick={() => { showToast("OTP Sent to new number"); setCurrentView('settings'); }} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg">Send Verification Code</button>
       </div>
  </div>
);

const UpdateLocationScreen = ({ user, setUser, setCurrentView, showToast }: any) => (
  <div className="bg-[#0B0F19] min-h-full flex flex-col">
       <div className="p-4 pt-safe-top flex items-center gap-4 sticky top-0 z-10 bg-[#0B0F19]/90 backdrop-blur-md border-b border-gray-800">
            <button onClick={() => setCurrentView('settings')} className="text-white bg-[#1F2937] p-2 rounded-full"><ChevronLeft /></button>
            <h2 className="text-lg font-bold text-white">Update Location</h2>
       </div>
       <div className="p-6 flex flex-col items-center">
           <div className="w-full h-48 bg-[#161f30] rounded-2xl mb-6 flex items-center justify-center border border-gray-800">
               <MapPin className="w-12 h-12 text-blue-500 animate-bounce" />
           </div>
           <p className="text-gray-300 text-center mb-2 font-medium">Current: {user?.address}</p>
           <p className="text-gray-500 text-xs text-center mb-8">Lat: {user?.location_lat.toFixed(4)}, Lng: {user?.location_lng.toFixed(4)}</p>
           
           <button onClick={() => {
              if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                      setUser({...user!, location_lat: pos.coords.latitude, location_lng: pos.coords.longitude, address: "Updated GPS Location"});
                      showToast("Location Updated");
                      setCurrentView('settings');
                  });
              }
           }} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
               <Crosshair className="w-5 h-5" /> Use Current GPS Location
           </button>
       </div>
  </div>
);

const NotificationsScreen = ({ setCurrentView, showToast }: any) => (
    <div className="bg-[#0B0F19] min-h-full flex flex-col">
       <div className="p-4 pt-safe-top flex items-center gap-4 sticky top-0 z-10 bg-[#0B0F19]/90 backdrop-blur-md border-b border-gray-800">
            <button onClick={() => setCurrentView('settings')} className="text-white bg-[#1F2937] p-2 rounded-full"><ChevronLeft /></button>
            <h2 className="text-lg font-bold text-white">Notifications</h2>
       </div>
       <div className="p-6 space-y-4">
           {[
               { title: 'Push Notifications', desc: 'Get alerts for new jobs & messages' },
               { title: 'Email Alerts', desc: 'Receive daily summaries' },
               { title: 'Sound', desc: 'Play sound on new notification' }
           ].map((item, i) => (
               <div key={i} className="flex items-center justify-between p-4 bg-[#1F2937] rounded-xl border border-gray-800">
                   <div>
                       <h4 className="text-white font-bold text-sm">{item.title}</h4>
                       <p className="text-gray-500 text-xs">{item.desc}</p>
                   </div>
                   <button className="text-green-500"><ToggleRight className="w-8 h-8" /></button>
               </div>
           ))}
           <button onClick={() => { showToast("Preferences Saved"); setCurrentView('settings'); }} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg mt-4">Save Preferences</button>
       </div>
    </div>
);

const PrivacyScreen = ({ setCurrentView }: any) => (
    <div className="bg-[#0B0F19] min-h-full flex flex-col">
       <div className="p-4 pt-safe-top flex items-center gap-4 sticky top-0 z-10 bg-[#0B0F19]/90 backdrop-blur-md border-b border-gray-800">
            <button onClick={() => setCurrentView('settings')} className="text-white bg-[#1F2937] p-2 rounded-full"><ChevronLeft /></button>
            <h2 className="text-lg font-bold text-white">Privacy Policy</h2>
       </div>
       <div className="p-6 text-gray-400 text-sm space-y-4 overflow-y-auto">
           <p>Last updated: November 2025</p>
           <p>WorkLink respects your privacy. This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you visit our mobile application.</p>
           <h3 className="text-white font-bold mt-4">Collection of Data</h3>
           <p>We may collect information about you in a variety of ways. The information we may collect via the Application depends on the content and materials you use, and includes: Personal Data, Derivative Data, Financial Data, and Geo-Location Information.</p>
           <h3 className="text-white font-bold mt-4">Security of Your Data</h3>
           <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.</p>
       </div>
    </div>
);

// --- New Navigation & Tracking Screens ---

const WorkerRouteScreen = ({ task, user, setCurrentView, showToast }: any) => {
    const [status, setStatus] = useState(task.status);
    const distance = calculateDistance(user.location_lat, user.location_lng, task.location_lat, task.location_lng);
    const duration = Math.ceil(distance * 2); // Rough estimate: 2 min per km

    const handleStartNav = () => {
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${user.location_lat},${user.location_lng}&destination=${task.location_lat},${task.location_lng}`, '_blank');
        setStatus(TaskStatus.ON_THE_WAY);
        showToast("Navigation Started! Status updated.");
    };

    const handleArrived = () => {
        setStatus(TaskStatus.IN_PROGRESS);
        showToast("You have arrived at the location.");
    };

    return (
        <div className="bg-[#0B0F19] min-h-full flex flex-col pb-20">
             <div className="p-4 pt-safe-top flex items-center gap-4 sticky top-0 z-10 bg-[#0B0F19] border-b border-gray-800">
                  <button onClick={() => setCurrentView('my-tasks')} className="text-white bg-[#1F2937] p-2 rounded-full"><ChevronLeft /></button>
                  <h2 className="text-lg font-bold text-white">Navigate to Job</h2>
             </div>

             {/* Map Area */}
             <div className="h-[50vh] w-full relative">
                 <MapVisualizer 
                    userLat={user.location_lat} 
                    userLng={user.location_lng}
                    destinationLat={task.location_lat}
                    destinationLng={task.location_lng}
                    showRoute={true}
                    isTrackingMode={status === TaskStatus.ON_THE_WAY}
                 />
                 <div className="absolute bottom-4 left-4 right-4 bg-[#1F2937]/90 backdrop-blur-md p-4 rounded-2xl border border-gray-700 shadow-xl flex justify-between items-center">
                     <div>
                         <p className="text-gray-400 text-xs uppercase font-bold">Distance</p>
                         <p className="text-white font-bold text-lg">{distance.toFixed(1)} km</p>
                     </div>
                     <div className="h-8 w-px bg-gray-700"></div>
                     <div>
                         <p className="text-gray-400 text-xs uppercase font-bold">Est. Time</p>
                         <p className="text-white font-bold text-lg">{duration} min</p>
                     </div>
                 </div>
             </div>

             {/* Actions */}
             <div className="p-6 space-y-4 flex-1 bg-[#0B0F19]">
                 <div className="flex items-center gap-3 mb-2">
                     <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                         <MapPin className="w-5 h-5 text-red-500" />
                     </div>
                     <div>
                         <h3 className="text-white font-bold">{task.address}</h3>
                         <p className="text-gray-500 text-xs">Destination</p>
                     </div>
                 </div>

                 {status === TaskStatus.ACCEPTED && (
                     <button onClick={handleStartNav} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 animate-pulse">
                         <NavIcon className="w-5 h-5" /> Start Navigation
                     </button>
                 )}
                 
                 {status === TaskStatus.ON_THE_WAY && (
                     <button onClick={handleArrived} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
                         <CheckCircle className="w-5 h-5" /> I Have Arrived
                     </button>
                 )}

                 {status === TaskStatus.IN_PROGRESS && (
                     <div className="w-full bg-gray-800 text-gray-300 font-bold py-4 rounded-xl text-center border border-gray-700">
                         Job In Progress...
                     </div>
                 )}
             </div>
        </div>
    );
};

const ProviderTrackingScreen = ({ task, setCurrentView }: any) => {
    // Simulated Worker Movement Logic
    const [workerPos, setWorkerPos] = useState({ lat: task.location_lat - 0.01, lng: task.location_lng - 0.01 }); // Start slightly away
    const [eta, setEta] = useState(15);

    useEffect(() => {
        const interval = setInterval(() => {
            setWorkerPos(prev => {
                const dLat = (task.location_lat - prev.lat) * 0.1; // Move 10% closer
                const dLng = (task.location_lng - prev.lng) * 0.1;
                
                // Stop if close enough
                if (Math.abs(dLat) < 0.0001 && Math.abs(dLng) < 0.0001) return prev;

                return { lat: prev.lat + dLat, lng: prev.lng + dLng };
            });
            setEta(prev => Math.max(1, prev - 1));
        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, [task]);

    return (
        <div className="bg-[#0B0F19] min-h-full flex flex-col pb-20">
             <div className="p-4 pt-safe-top flex items-center gap-4 sticky top-0 z-10 bg-[#0B0F19] border-b border-gray-800">
                  <button onClick={() => setCurrentView('task-detail')} className="text-white bg-[#1F2937] p-2 rounded-full"><ChevronLeft /></button>
                  <h2 className="text-lg font-bold text-white">Live Tracking</h2>
             </div>

             {/* Map Area */}
             <div className="h-[60vh] w-full relative">
                 <MapVisualizer 
                    userLat={workerPos.lat} 
                    userLng={workerPos.lng}
                    destinationLat={task.location_lat}
                    destinationLng={task.location_lng}
                    showRoute={true}
                    isTrackingMode={true}
                 />
                 
                 {/* ETA Overlay */}
                 <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-700 shadow-lg text-right">
                     <span className="text-[10px] text-gray-400 uppercase font-bold block">Arriving In</span>
                     <span className="text-white font-bold text-xl flex items-center gap-1 justify-end"><Clock className="w-4 h-4 text-blue-500" /> {eta} min</span>
                 </div>
             </div>

             {/* Status Card */}
             <div className="flex-1 bg-[#0B0F19] p-6 border-t border-gray-800">
                 <div className="bg-[#1F2937] p-4 rounded-2xl border border-gray-700 mb-4 flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-[#0B0F19]">
                         {task.workerName ? task.workerName.charAt(0) : 'W'}
                     </div>
                     <div>
                         <h3 className="text-white font-bold">{task.workerName || 'Worker'}</h3>
                         <p className="text-green-400 text-xs font-bold flex items-center gap-1"><Car className="w-3 h-3" /> On the way to location</p>
                     </div>
                     <button className="ml-auto bg-gray-800 p-2 rounded-full text-gray-300 hover:text-white"><Phone className="w-5 h-5" /></button>
                 </div>

                 <div className="space-y-4">
                     <div className="flex gap-3">
                         <div className="flex flex-col items-center">
                             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                             <div className="w-0.5 h-8 bg-gray-700 my-1"></div>
                             <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                         </div>
                         <div>
                             <p className="text-white text-sm font-medium">Worker started navigation</p>
                             <p className="text-gray-500 text-xs">10:30 AM</p>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    );
};

// --- New MyJobs Screen Component (Separated) ---
const MyJobsScreen = ({ user, tasks, setCurrentView, setSelectedTask }: any) => {
    const [jobTab, setJobTab] = useState<'Assigned' | 'Ongoing' | 'Completed'>('Assigned');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const filteredJobs = tasks.filter((t: Task) => {
        // In a real app, filter by workerId: t.workerId === user?.id
        // For demo, we show tasks with status relevant to the tab
        if (jobTab === 'Assigned') return t.status === TaskStatus.ACCEPTED;
        if (jobTab === 'Ongoing') return t.status === TaskStatus.ON_THE_WAY || t.status === TaskStatus.IN_PROGRESS;
        if (jobTab === 'Completed') return t.status === TaskStatus.COMPLETED;
        return false;
    });

    // Mock data injection for demo if empty to ensure UI is visible for testing
    const displayJobs = filteredJobs.length > 0 ? filteredJobs : (
        jobTab === 'Assigned' ? [
            { ...INITIAL_TASKS[0], id: 'demo1', status: TaskStatus.ACCEPTED, providerName: 'Demo Provider', distanceKm: 2.5, budget: 40, title: 'Example Assigned Task', category: TaskCategory.CLEANING }
        ] : []
    );

    return (
      <div className="bg-[#0B0F19] min-h-full flex flex-col pb-24">
           <div className="p-4 pt-safe-top flex items-center justify-between bg-[#0B0F19] sticky top-0 z-10 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">My Jobs</h2>
                <button onClick={handleRefresh} className={`p-2 rounded-full bg-[#1F2937] text-gray-400 hover:text-white ${isRefreshing ? 'animate-spin' : ''}`}>
                    <RefreshCw className="w-5 h-5" />
                </button>
           </div>

           {/* Tabs */}
           <div className="flex p-4 gap-2 bg-[#0B0F19]">
               {['Assigned', 'Ongoing', 'Completed'].map(tab => (
                   <button 
                     key={tab} 
                     onClick={() => setJobTab(tab as any)}
                     className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${jobTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'bg-[#1F2937] text-gray-400 hover:bg-gray-800'}`}
                   >
                       {tab}
                   </button>
               ))}
           </div>

           {/* Job List */}
           <div className="flex-1 px-4 space-y-4 overflow-y-auto">
               {displayJobs.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-20 text-center">
                       <div className="w-20 h-20 bg-[#1F2937] rounded-full flex items-center justify-center mb-4">
                           <Briefcase className="w-10 h-10 text-gray-600" />
                       </div>
                       <h3 className="text-white font-bold mb-1">No Jobs Found</h3>
                       <p className="text-gray-500 text-sm mb-6">You don't have any {jobTab.toLowerCase()} jobs.</p>
                       <button onClick={() => setCurrentView('dashboard')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg">
                           Find New Jobs
                       </button>
                   </div>
               ) : (
                   displayJobs.map((job: any) => (
                       <div key={job.id} className="bg-[#1F2937] rounded-2xl p-5 border border-gray-800 shadow-lg relative overflow-hidden">
                           <div className="flex justify-between items-start mb-3">
                               <div>
                                   <h3 className="font-bold text-white text-lg mb-1">{job.title}</h3>
                                   <p className="text-gray-400 text-xs">{job.providerName} • {job.category}</p>
                               </div>
                               <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wide ${job.status === TaskStatus.ACCEPTED ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : job.status === TaskStatus.COMPLETED ? 'bg-gray-700/50 text-gray-400' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                   {job.status.replace(/_/g, ' ')}
                               </span>
                           </div>

                           <div className="flex items-center gap-4 mb-4 text-sm text-gray-300">
                               <div className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded-lg">
                                   <span className="text-green-400 font-bold">$</span> {job.budget}
                               </div>
                               <div className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded-lg">
                                   <MapPin className="w-3.5 h-3.5 text-blue-400" /> {job.distanceKm ? job.distanceKm.toFixed(1) : '2.5'} km
                               </div>
                           </div>

                           <div className="flex gap-3">
                               <button 
                                 onClick={() => { setSelectedTask(job); setCurrentView('task-detail'); }}
                                 className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold text-xs transition-colors"
                               >
                                   View Details
                               </button>
                               {(job.status === TaskStatus.ACCEPTED || job.status === TaskStatus.ON_THE_WAY || job.status === TaskStatus.IN_PROGRESS) && (
                                   <button 
                                     onClick={() => { setSelectedTask(job); setCurrentView('worker-navigation'); }}
                                     className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                                   >
                                       <NavIcon className="w-3.5 h-3.5" /> {job.status === TaskStatus.ACCEPTED ? 'Start Job' : 'Track Job'}
                                   </button>
                               )}
                           </div>
                       </div>
                   ))
               )}
           </div>
      </div>
    );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  
  // Worker Dashboard State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Provider Dashboard State
  const [providerFilter, setProviderFilter] = useState('All');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [providerApplicants, setProviderApplicants] = useState([
      { id: 101, name: 'John Doe', rating: 4.8, skills: ['Plumber', 'Electrician'], status: 'pending' },
      { id: 102, name: 'Sarah Smith', rating: 4.5, skills: ['Cleaning'], status: 'pending' },
      { id: 103, name: 'Mike Ross', rating: 4.9, skills: ['Helper', 'Shifting'], status: 'pending' },
  ]);

  // Post Task State
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [draftTask, setDraftTask] = useState<any>(null);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
      setToast({msg, type});
      setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => { setUser(null); setDraftTask(null); setPrompt(''); setCurrentView('dashboard'); };
  
  const handleApplicantAction = (id: number, action: 'accept' | 'reject') => {
      if (action === 'reject') {
          setProviderApplicants(prev => prev.filter(a => a.id !== id));
          showToast("Applicant rejected", 'error');
      } else {
          setProviderApplicants(prev => prev.map(a => a.id === id ? { ...a, status: 'accepted' } : a));
          showToast("Applicant accepted! They have been notified.");
      }
  };

  // Simulate data fetching when filter changes
  useEffect(() => {
    if (user?.role === UserRole.WORKER && currentView === 'dashboard') {
      setIsLoadingTasks(true);
      const timer = setTimeout(() => setIsLoadingTasks(false), 800);
      return () => clearTimeout(timer);
    }
  }, [activeFilter, searchQuery]);

  const renderWorkerDashboard = () => (
    <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#0B0F19]/95 backdrop-blur-md border-b border-gray-800 pt-safe-top px-4 pb-4">
            <div className="flex justify-between items-center mb-4 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-white">{getGreeting()}, {user?.name.split(' ')[0]}</h1>
                    <p className="text-gray-400 text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {user?.address}
                    </p>
                </div>
                <button onClick={() => setCurrentView('notifications')} className="relative p-2 bg-[#1F2937] rounded-full text-gray-300 hover:text-white">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#1F2937]"></span>
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search jobs (e.g. Cleaning, Repair)..." 
                    className="w-full bg-[#1F2937] border border-gray-800 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {['All', 'Cleaning', 'Repair', 'Shifting', 'Helper'].map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setActiveFilter(cat)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeFilter === cat ? 'bg-blue-600 text-white' : 'bg-[#1F2937] text-gray-400 border border-gray-800'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {/* Map Preview */}
        <div className="px-4 mt-4 mb-6">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-bold text-sm">Nearby Jobs</h3>
                <button className="text-blue-400 text-xs font-bold flex items-center gap-1">View Map <ChevronRight className="w-3 h-3" /></button>
            </div>
            <MapVisualizer 
                userLat={user!.location_lat} 
                userLng={user!.location_lng} 
                tasks={tasks}
                onTaskSelect={(t) => { setSelectedTask(t); setCurrentView('task-detail'); }}
            />
        </div>

        {/* Task List */}
        <div className="px-4">
            <h3 className="text-white font-bold text-sm mb-3">Recent Opportunities</h3>
            {isLoadingTasks ? (
                <div className="flex flex-col items-center py-10">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                    <p className="text-gray-500 text-xs">Finding best matches...</p>
                </div>
            ) : (
                tasks
                    .filter(t => t.status === TaskStatus.OPEN)
                    .filter(t => activeFilter === 'All' || t.category === activeFilter)
                    .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(task => (
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        userRole={UserRole.WORKER} 
                        onClick={(t) => { setSelectedTask(t); setCurrentView('task-detail'); }} 
                    />
                ))
            )}
            {tasks.length === 0 && !isLoadingTasks && (
                <p className="text-gray-500 text-center py-10">No jobs found nearby.</p>
            )}
        </div>
    </div>
  );

  const renderProviderDashboard = () => (
    <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#0B0F19]/95 backdrop-blur-md border-b border-gray-800 pt-safe-top px-4 pb-4">
            <div className="flex justify-between items-center mb-6 mt-2">
                 <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400 text-xs">Manage your posted jobs</p>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
                    <Building className="w-5 h-5 text-blue-400" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#1F2937] p-4 rounded-2xl border border-gray-800 shadow-lg">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mb-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-2xl font-bold text-white block">3</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Active Jobs</span>
                </div>
                <div className="bg-[#1F2937] p-4 rounded-2xl border border-gray-800 shadow-lg">
                     <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mb-2">
                        <UserIcon className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-2xl font-bold text-white block">12</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Applicants</span>
                </div>
            </div>

            {/* Action Button */}
            <button 
                onClick={() => setCurrentView('post-task')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all"
            >
                <PlusCircle className="w-5 h-5" /> Post a New Job
            </button>
        </div>

        {/* My Posts */}
        <div className="px-4 mt-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm">Your Job Posts</h3>
                <div className="flex bg-[#1F2937] rounded-lg p-1">
                    <button onClick={() => setProviderFilter('All')} className={`px-3 py-1 rounded-md text-[10px] font-bold ${providerFilter === 'All' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>All</button>
                    <button onClick={() => setProviderFilter('Open')} className={`px-3 py-1 rounded-md text-[10px] font-bold ${providerFilter === 'Open' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>Open</button>
                    <button onClick={() => setProviderFilter('Active')} className={`px-3 py-1 rounded-md text-[10px] font-bold ${providerFilter === 'Active' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>Active</button>
                </div>
            </div>
            
            <div className="space-y-3">
                {/* Demo Expanded Card Logic */}
                {INITIAL_TASKS.map(task => (
                    <div key={task.id} className="bg-[#1F2937] rounded-2xl border border-gray-800 overflow-hidden">
                        <div 
                            className="p-4 flex justify-between items-start cursor-pointer hover:bg-gray-800/50 transition-colors"
                            onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                        >
                            <div>
                                <h4 className="text-white font-bold mb-1">{task.title}</h4>
                                <p className="text-gray-400 text-xs mb-2 line-clamp-1">{task.description}</p>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700`}>{task.category}</span>
                                    <span className="text-[10px] text-gray-500 flex items-center"><Clock className="w-3 h-3 mr-1" /> Posted 2h ago</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="text-green-400 font-bold text-sm">${task.budget}</span>
                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedTaskId === task.id ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                        
                        {/* Expanded Applicants Section */}
                        {expandedTaskId === task.id && (
                            <div className="bg-[#161f30] p-4 border-t border-gray-800 animate-in slide-in-from-top-2">
                                <h5 className="text-xs font-bold text-gray-500 uppercase mb-3">Applicants (3)</h5>
                                <div className="space-y-3">
                                    {providerApplicants.map(applicant => (
                                        <div key={applicant.id} className="flex items-center justify-between bg-[#1F2937] p-3 rounded-xl border border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs text-white font-bold">
                                                    {applicant.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-white text-sm font-bold">{applicant.name}</p>
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                        <span className="text-xs text-gray-400">{applicant.rating}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {applicant.status === 'pending' ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleApplicantAction(applicant.id, 'reject')} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                                                    <button onClick={() => handleApplicantAction(applicant.id, 'accept')} className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-colors"><CheckCircle className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <span className="text-green-500 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-lg">Hired</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => { setSelectedTask(task); setCurrentView('provider-tracking'); }}
                                    className="w-full mt-4 bg-blue-600/20 text-blue-400 font-bold py-3 rounded-xl border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
                                >
                                    Track Active Job
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  const renderPostTask = () => (
    <div className="min-h-full bg-[#0B0F19] flex flex-col">
        <div className="p-4 pt-safe-top flex items-center gap-4 sticky top-0 z-10 bg-[#0B0F19] border-b border-gray-800">
             <button onClick={() => setCurrentView('dashboard')} className="text-white bg-[#1F2937] p-2 rounded-full"><ChevronLeft /></button>
             <h2 className="text-lg font-bold text-white">Post a New Job</h2>
        </div>

        {!draftTask ? (
            <div className="flex-1 p-6 flex flex-col">
                 <label className="text-gray-300 font-bold mb-2">Describe your task</label>
                 <p className="text-gray-500 text-xs mb-4">Our AI will automatically extract details like budget, location, and category.</p>
                 
                 <div className="relative flex-1 mb-4">
                    <textarea 
                        className="w-full h-64 bg-[#1F2937] border border-gray-700 rounded-2xl p-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-lg leading-relaxed"
                        placeholder="e.g. I need someone to clean my 2 bedroom apartment in Downtown this Friday. Budget is around $80."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                        <button className="p-2 bg-gray-700 rounded-full text-gray-300 hover:text-white"><Sparkles className="w-4 h-4" /></button>
                    </div>
                 </div>
                 
                 <button 
                    onClick={async () => {
                        if(!prompt.trim()) return showToast("Please enter a description", "error");
                        setIsAnalyzing(true);
                        const result = await analyzeTaskDescription(prompt);
                        if (result) {
                             setDraftTask({
                                 ...result,
                                 id: `t_${Date.now()}`,
                                 providerId: user!.id,
                                 providerName: user!.name,
                                 providerRating: user!.rating,
                                 status: TaskStatus.OPEN,
                                 createdAt: Date.now(),
                                 location_lat: user!.location_lat, // Default to user loc
                                 location_lng: user!.location_lng,
                                 address: result.locationText || user!.address
                             });
                        } else {
                            showToast("Failed to analyze. Please try again.", "error");
                        }
                        setIsAnalyzing(false);
                    }}
                    disabled={isAnalyzing}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                     {isAnalyzing ? <Loader2 className="animate-spin" /> : <><Sparkles className="w-5 h-5" /> Analyze with AI</>}
                 </button>
            </div>
        ) : (
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center gap-2 mb-6 bg-green-500/10 p-3 rounded-xl border border-green-500/20">
                    <Sparkles className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 text-sm font-bold">AI Analysis Complete! Review details below.</span>
                </div>

                <div className="space-y-4 mb-8">
                    <InputField label="Title" value={draftTask.title} onChange={(e:any) => setDraftTask({...draftTask, title: e.target.value})} />
                    
                    <div>
                         <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                         <textarea 
                            className="w-full bg-[#1F2937] border border-gray-700 rounded-xl p-3 text-white h-24 resize-none"
                            value={draftTask.description}
                            onChange={(e) => setDraftTask({...draftTask, description: e.target.value})}
                         />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <InputField label="Budget ($)" type="number" value={draftTask.budget || ''} onChange={(e:any) => setDraftTask({...draftTask, budget: Number(e.target.value)})} />
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                            <select 
                                value={draftTask.category}
                                onChange={(e) => setDraftTask({...draftTask, category: e.target.value})}
                                className="w-full bg-[#1F2937] border border-gray-700 text-white rounded-xl px-4 py-4 focus:outline-none"
                            >
                                {Object.values(TaskCategory).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                         </div>
                    </div>
                    
                    <InputField label="Location" value={draftTask.address} onChange={(e:any) => setDraftTask({...draftTask, address: e.target.value})} icon={MapPin} />
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setDraftTask(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl">Back</button>
                    <button 
                        onClick={() => {
                            setTasks([draftTask, ...tasks]);
                            showToast("Job Posted Successfully!");
                            setDraftTask(null);
                            setPrompt('');
                            setCurrentView('dashboard');
                        }}
                        className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg"
                    >
                        Confirm & Post
                    </button>
                </div>
            </div>
        )}
    </div>
  );

  const renderTaskDetail = () => {
    if (!selectedTask) return null;
    const isMyTask = selectedTask.providerId === user?.id;
    const isApplied = false; // Mock state

    return (
      <div className="min-h-full bg-[#0B0F19] pb-24 relative">
           {/* Header Image / Map Placeholder */}
           <div className="h-64 relative">
               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0B0F19] z-10"></div>
               <MapVisualizer userLat={user!.location_lat} userLng={user!.location_lng} tasks={[selectedTask]} />
               
               <button onClick={() => setCurrentView('dashboard')} className="absolute top-safe-top left-4 z-20 bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/70">
                   <ChevronLeft />
               </button>
           </div>

           <div className="px-6 -mt-12 relative z-20">
               <div className="bg-[#1F2937] p-6 rounded-3xl border border-gray-800 shadow-2xl mb-6">
                   <div className="flex justify-between items-start mb-4">
                       <span className={`px-3 py-1 rounded-lg text-xs font-bold border uppercase tracking-wide ${selectedTask.category === 'Cleaning' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                           {selectedTask.category}
                       </span>
                       <span className="text-2xl font-bold text-green-400">${selectedTask.budget}</span>
                   </div>
                   <h1 className="text-2xl font-bold text-white mb-2">{selectedTask.title}</h1>
                   <p className="text-gray-400 text-sm leading-relaxed mb-6">{selectedTask.description}</p>
                   
                   <div className="flex items-center gap-4 border-t border-gray-700 pt-4">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold">
                            {selectedTask.providerName.charAt(0)}
                        </div>
                        <div>
                            <p className="text-white text-sm font-bold">{selectedTask.providerName}</p>
                            <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                <span className="text-xs text-gray-400">{selectedTask.providerRating} • Verified Provider</span>
                            </div>
                        </div>
                        {user?.role === UserRole.WORKER && (
                            <button className="ml-auto p-2 bg-blue-600/10 rounded-full text-blue-400"><Mail className="w-5 h-5" /></button>
                        )}
                   </div>
               </div>

               <div className="space-y-3 mb-8">
                   <div className="bg-[#1F2937] p-4 rounded-2xl border border-gray-800 flex items-center gap-3">
                       <MapPin className="w-5 h-5 text-gray-500" />
                       <div>
                           <p className="text-gray-400 text-xs uppercase font-bold">Location</p>
                           <p className="text-white text-sm">{selectedTask.address}</p>
                       </div>
                   </div>
                   <div className="bg-[#1F2937] p-4 rounded-2xl border border-gray-800 flex items-center gap-3">
                       <Clock className="w-5 h-5 text-gray-500" />
                       <div>
                           <p className="text-gray-400 text-xs uppercase font-bold">Date & Time</p>
                           <p className="text-white text-sm">{selectedTask.date || 'Flexible / ASAP'}</p>
                       </div>
                   </div>
               </div>

               {/* Action Button */}
               {user?.role === UserRole.WORKER && (
                   <div className="fixed bottom-24 left-0 w-full px-6">
                       {selectedTask.status === TaskStatus.ACCEPTED ? (
                           <button 
                             onClick={() => setCurrentView('worker-navigation')}
                             className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
                           >
                               <NavIcon className="w-5 h-5" /> Start Navigation
                           </button>
                       ) : isApplied ? (
                           <button disabled className="w-full bg-gray-700 text-gray-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                               <CheckCircle className="w-5 h-5" /> Applied
                           </button>
                       ) : (
                           <button 
                             onClick={() => { showToast("Application Sent! Waiting for approval."); setCurrentView('dashboard'); }}
                             className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20"
                           >
                               Apply for Job
                           </button>
                       )}
                   </div>
               )}

               {isMyTask && (
                   <div className="fixed bottom-24 left-0 w-full px-6">
                       <button 
                         onClick={() => setCurrentView('provider-tracking')}
                         className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg"
                       >
                           Manage Applicants / Track
                       </button>
                   </div>
               )}
           </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="min-h-full bg-[#0B0F19] flex flex-col pb-24">
        <div className="p-6 pt-safe-top bg-[#1F2937] rounded-b-[32px] mb-6 shadow-lg border-b border-gray-800">
            <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
            <div className="flex items-center gap-4 mb-2">
                 <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold text-white border-2 border-gray-600">
                     {user?.name.charAt(0)}
                 </div>
                 <div>
                     <h2 className="text-lg font-bold text-white">{user?.name}</h2>
                     <p className="text-gray-400 text-sm">{user?.email}</p>
                 </div>
            </div>
        </div>

        <div className="px-6 space-y-3">
            <h3 className="text-gray-500 text-xs font-bold uppercase ml-2 mb-1">Account</h3>
            <SettingsItem icon={UserIcon} label="Edit Profile" onClick={() => setCurrentView('settings-edit-profile')} />
            <SettingsItem icon={Lock} label="Change Password" onClick={() => setCurrentView('settings-password')} />
            <SettingsItem icon={Phone} label="Phone Number" onClick={() => setCurrentView('settings-phone')} />
            <SettingsItem icon={MapPin} label="Update Location" onClick={() => setCurrentView('settings-location')} />

            <h3 className="text-gray-500 text-xs font-bold uppercase ml-2 mb-1 mt-6">Preferences</h3>
            <SettingsItem icon={Bell} label="Notifications" onClick={() => setCurrentView('settings-notifications')} />
            <SettingsItem icon={ShieldCheck} label="Privacy & Security" onClick={() => setCurrentView('settings-privacy')} />

            <h3 className="text-gray-500 text-xs font-bold uppercase ml-2 mb-1 mt-6">Actions</h3>
            <SettingsItem icon={LogOut} label="Log Out" onClick={handleLogout} danger />
        </div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-[#0B0F19] font-sans overflow-hidden flex flex-col">
      <div className="mx-auto w-full h-full max-w-md md:border-x md:border-gray-800 relative bg-[#0B0F19] shadow-2xl">
        {!user ? (
          <AuthFlow onComplete={setUser} />
        ) : (
          <div className="flex-1 flex flex-col h-full relative overflow-hidden">
            <main className="flex-1 h-full overflow-y-auto scroll-smooth no-scrollbar relative bg-[#0B0F19]">
              {currentView === 'dashboard' && user.role === UserRole.WORKER && renderWorkerDashboard()}
              {currentView === 'dashboard' && user.role === UserRole.PROVIDER && renderProviderDashboard()}
              {currentView === 'post-task' && renderPostTask()}
              {currentView === 'task-detail' && renderTaskDetail()}
              {currentView === 'settings' && renderSettings()}
              
              {/* New Tracking Screens */}
              {currentView === 'worker-navigation' && <WorkerRouteScreen task={selectedTask} user={user} setCurrentView={setCurrentView} showToast={showToast} />}
              {currentView === 'provider-tracking' && <ProviderTrackingScreen task={selectedTask} setCurrentView={setCurrentView} />}

              {/* Fix: Render new Profile Screens */}
              {currentView === 'profile' && <ProfileScreen user={user} setUser={setUser} setCurrentView={setCurrentView} handleLogout={handleLogout} />}
              {currentView === 'profile-experience' && <WorkerExperienceScreen user={user} setUser={setUser} setCurrentView={setCurrentView} showToast={showToast} />}

              {/* Fix: Use Components instead of Functions for these screens */}
              {currentView === 'settings-edit-profile' && <EditProfileScreen user={user} setUser={setUser} setCurrentView={setCurrentView} showToast={showToast} />}
              {currentView === 'settings-password' && <ChangePasswordScreen setCurrentView={setCurrentView} showToast={showToast} />}
              {currentView === 'settings-phone' && <ChangePhoneScreen setCurrentView={setCurrentView} showToast={showToast} />}
              {currentView === 'settings-location' && <UpdateLocationScreen user={user} setUser={setUser} setCurrentView={setCurrentView} showToast={showToast} />}
              {currentView === 'settings-notifications' && <NotificationsScreen setCurrentView={setCurrentView} showToast={showToast} />}
              {currentView === 'settings-privacy' && <PrivacyScreen setCurrentView={setCurrentView} />}
              
              {/* Fix: Connected My Jobs Screen */}
              {currentView === 'my-tasks' && <MyJobsScreen user={user} tasks={tasks} setCurrentView={setCurrentView} setSelectedTask={setSelectedTask} />}
            </main>
            {/* Toast Notification */}
            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            <Navigation role={user.role} currentView={currentView} onChangeView={setCurrentView} onLogout={handleLogout} />
          </div>
        )}
      </div>
    </div>
  );
}

// ... (Subcomponents NavStatCard remains unchanged) ...
