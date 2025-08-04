import React from "react";
import Chart from "react-apexcharts";
import { motion } from "framer-motion";
import { Banknote, BarChart2, Zap, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const chartOptions = {
    chart: {
      id: "balance-chart",
      background: "transparent",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    theme: { mode: "dark" },
    grid: { show: false },
    stroke: { curve: "smooth" },
    xaxis: {
      categories: ["Jul 1", "Jul 2", "Jul 3", "Jul 4", "Jul 5"],
      labels: { style: { colors: "#fff" } },
    },
    yaxis: [{
      title: { text: "USD", style: { color: "#fff" } },
      labels: { style: { colors: "#fff" } },
    }],
    tooltip: {
      theme: "dark"
    },
  };

  const chartSeries = [
    {
      name: "USD",
      data: [980, 1000, 1050, 1045, 1051.22],
    }
  ];

  const cardClass = "bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-xl p-6 text-white w-full flex flex-col gap-2 hover:scale-[1.02] transition";

  return (
    <div className="flex flex-col gap-8 p-8">
      <h1 className="text-3xl font-bold text-white">Panel de Control</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ scale: 1.03 }} className={cardClass}>
          <Zap className="text-yellow-400" />
          <span className="text-sm text-gray-400">SmartTrades activos</span>
          <span className="text-xl font-semibold">0</span>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} className={cardClass}>
          <TrendingUp className="text-green-400" />
          <span className="text-sm text-gray-400">PnL de hoy</span>
          <span className="text-xl font-semibold">$0</span>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} className={cardClass}>
          <BarChart2 className="text-blue-400" />
          <span className="text-sm text-gray-400">Bots activos</span>
          <span className="text-xl font-semibold">3</span>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} className={cardClass}>
          <Banknote className="text-purple-400" />
          <span className="text-sm text-gray-400">Balance actual</span>
          <span className="text-xl font-semibold">$1,051.22</span>
        </motion.div>
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-xl p-6">
        <h2 className="text-white text-lg font-semibold mb-4">Evolución de saldo (USD)</h2>
        <Chart options={chartOptions} series={chartSeries} type="line" height={300} />
      </div>
    </div>
  );
};

export default Dashboard;