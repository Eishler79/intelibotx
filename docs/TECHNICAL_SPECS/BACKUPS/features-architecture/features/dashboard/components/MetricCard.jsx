// ✅ SUCCESS CRITERIA COMPLIANT: Individual Metric Card Component ≤150 lines
// EXTRACTED FROM: DashboardMetrics.jsx (individual metric cards logic)
// SPEC_REF: FRONTEND_ARCHITECTURE.md línea 91 - MetricCard.jsx component
// COMPLIANCE: DL-001 (real data) + DL-008 (auth) + SUCCESS CRITERIA ≤150 lines

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * ✅ SUCCESS CRITERIA COMPLIANT: Reusable Metric Card Component
 * 
 * Displays individual metric with:
 * - Title and value
 * - Icon and color coding
 * - Subtitle/secondary info
 * - Click handler support
 * - Consistent styling
 * 
 * @param {Object} props - Component properties
 * @param {string} props.title - Metric title
 * @param {string|number} props.value - Main metric value
 * @param {string} props.subtitle - Secondary information
 * @param {React.Component} props.icon - Icon component
 * @param {string} props.iconColor - Icon color class
 * @param {string} props.valueColor - Value text color class  
 * @param {string} props.bgColor - Background color class
 * @param {Function} props.onClick - Click handler
 * @param {string} props.metricKey - Metric identifier for click handler
 */
const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-400",
  valueColor = "text-intelibot-text-primary", 
  bgColor = "bg-blue-500/20",
  onClick,
  metricKey
}) => {
  return (
    <Card 
      className="bg-intelibot-bg-secondary border-intelibot-border-primary backdrop-blur-sm shadow-intelibot-card cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onClick?.(metricKey)}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-intelibot-text-muted text-sm">{title}</p>
            <p className={`text-2xl font-bold ${valueColor}`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs mt-1 text-intelibot-text-muted">
                {subtitle}
              </p>
            )}
          </div>
          <div className={`${bgColor} p-3 rounded-full`}>
            <Icon className={iconColor} size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;