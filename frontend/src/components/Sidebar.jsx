import React from "react";
import { NavLink } from "react-router-dom";
import { Home, BarChart2, PieChart, Cpu, Layers, Bot } from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: <Home size={18} /> },
  { to: "/smart-trade", label: "SmartTrade Panel", icon: <BarChart2 size={18} /> },
  { to: "/intelligence", label: "Inteligencia", icon: <Cpu size={18} /> },
  { to: "/portfolio", label: "Portafolio", icon: <PieChart size={18} /> },
  { to: "/bots", label: "🤖 InteliBots AI", icon: <Bot size={18} /> },
];

const Sidebar = () => {
  return (
    <aside className="bg-[#0F172A] text-white w-64 min-h-screen border-r border-slate-800">
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
    </aside>
  );
};

export default Sidebar;