import React, { useState } from "react";
import { UserCircle, LogOut, Settings } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  return (
    <header className="bg-[#1E293B] text-white px-6 py-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-semibold tracking-wide">InteliBotX Panel</h1>
      
      <div className="relative">
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:bg-slate-700/50 rounded-lg px-3 py-2 transition-colors"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="text-right">
            <div className="text-sm font-medium">{user?.full_name || 'User'}</div>
            <div className="text-xs text-slate-400">{user?.email}</div>
          </div>
          <UserCircle size={32} className="text-blue-400" />
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50">
            <div className="py-2">
              {/* User Info */}
              <div className="px-4 py-2 border-b border-slate-700">
                <div className="text-sm font-medium text-white">{user?.full_name}</div>
                <div className="text-xs text-slate-400">{user?.email}</div>
                <div className="text-xs text-green-400 mt-1">
                  {user?.preferred_mode} Mode • {user?.api_keys_configured ? 'API Keys Configured' : 'No API Keys'}
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center">
                  <Settings size={16} className="mr-3" />
                  Account Settings
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center"
                >
                  <LogOut size={16} className="mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-10"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </header>
  );
};

export default Header;