import React from "react";
import { UserCircle } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-[#1E293B] text-white px-6 py-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-semibold tracking-wide">Panel de Control</h1>
      <div className="flex items-center space-x-3">
        <span className="text-sm">Eduard Guzmán</span>
        <UserCircle size={28} className="text-yellow-400" />
      </div>
    </header>
  );
};

export default Header;