import React from "react";
import { NavLink } from "react-router-dom";
import { Home, PieChart, Bot, Link, X } from "lucide-react";
// Temporarily removed: BarChart2, Cpu, Layers for scope reduction

// ✅ DL-001 COMPLIANCE: Frontend scope reduction - Core pages only
const links = [
  { to: "/dashboard", label: "Dashboard", icon: <Home size={18} /> },
  // { to: "/smart-trade", label: "SmartTrade Panel", icon: <BarChart2 size={18} /> }, // TEMPORARILY DISABLED
  // { to: "/intelligence", label: "Inteligencia", icon: <Cpu size={18} /> }, // TEMPORARILY DISABLED
  { to: "/portfolio", label: "Portafolio", icon: <PieChart size={18} /> },
  { to: "/bots", label: "🤖 InteliBots AI", icon: <Bot size={18} /> },
  { to: "/exchanges", label: "🔗 Mis Exchanges", icon: <Link size={18} /> },
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex bg-[#0F172A] text-white w-64 min-h-screen border-r border-slate-800">
        <div className="flex flex-col w-full">
          <div className="p-6 text-2xl font-bold text-cyan-400 tracking-wide border-b border-slate-800">
            InteliBotX
          </div>
          <nav className="flex flex-col px-4 py-6 space-y-2">
            {links.map(({ to, label, icon }) => (
              <NavLink
                to={to}
                key={to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? "bg-cyan-400 text-black shadow-md"
                      : "hover:bg-[#1A2136] text-gray-300"
                  }`
                }
              >
                {icon}
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={onClose}
          />

          {/* Sidebar */}
          <aside className="relative bg-[#0F172A] text-white w-64 min-h-screen border-r border-slate-800">
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <div className="text-2xl font-bold text-cyan-400 tracking-wide">
                  InteliBotX
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex flex-col px-4 py-6 space-y-2">
                {links.map(({ to, label, icon }) => (
                  <NavLink
                    to={to}
                    key={to}
                    end
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all ${
                        isActive
                          ? "bg-cyan-400 text-black shadow-md"
                          : "hover:bg-[#1A2136] text-gray-300"
                      }`
                    }
                  >
                    {icon}
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;