import React, { useMemo, useEffect } from 'react';
import { Ticket, BranchConfig } from '../types';
import { BarChart3, TrendingUp, Calendar, Clock } from 'lucide-react';
import { generateMockTickets } from '../utils/mockData';

interface ManagerDashboardProps {
  tickets: Ticket[];
  branch: BranchConfig;
  onAddMockData?: (mockTickets: Ticket[]) => void;
}

interface PeakAnalytics {
  peakHoursByDay: { [day: string]: { hour: number; count: number }[] };
  peakHoursData: { hour: number; count: number }[]; // For line graph (8am-4pm)
  peakDayOfWeek: { day: string; count: number };
  peakWeekOfMonth: { week: number; month: number; year: number; count: number };
  peakMonthOfQuarter: { month: number; quarter: number; year: number; count: number };
  peakMonthOfYear: { month: number; year: number; count: number };
  peakQuarterOfYear: { quarter: number; year: number; count: number };
  averages: {
    perDay: number;
    perWeek: number;
    perMonth: number;
    perQuarter: number;
    perYear: number;
  };
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ tickets, branch, onAddMockData }) => {
  // Auto-generate mock data if no tickets exist
  useEffect(() => {
    const branchTickets = tickets.filter(t => t.branchId === branch.id);
    if (branchTickets.length === 0 && onAddMockData) {
      const mockTickets = generateMockTickets(branch.id, 500);
      onAddMockData(mockTickets);
    }
  }, [tickets, branch.id, onAddMockData]);

  const analytics = useMemo(() => {
    const branchTickets = tickets.filter(t => t.branchId === branch.id);
    
    if (branchTickets.length === 0) {
      return null;
    }

    // Helper to get day of week name
    const getDayName = (date: Date) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getDay()];
    };

    // Helper to get week of month (1-5)
    const getWeekOfMonth = (date: Date) => {
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const firstDayOfWeek = firstDay.getDay();
      const dayOfMonth = date.getDate();
      return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
    };

    // Helper to get quarter (1-4)
    const getQuarter = (date: Date) => {
      return Math.floor(date.getMonth() / 3) + 1;
    };

    // Group tickets by various time periods
    const hoursByDay: { [day: string]: { [hour: number]: number } } = {};
    const dayCounts: { [day: string]: number } = {};
    const weekCounts: { [key: string]: number } = {};
    const monthOfQuarterCounts: { [key: string]: number } = {};
    const monthOfYearCounts: { [key: string]: number } = {};
    const quarterOfYearCounts: { [key: string]: number } = {};

    // Date range tracking
    let earliestDate: Date | null = null;
    let latestDate: Date | null = null;

    branchTickets.forEach(ticket => {
      const date = new Date(ticket.joinedAt);
      
      // Track date range
      if (!earliestDate || date < earliestDate) earliestDate = date;
      if (!latestDate || date > latestDate) latestDate = date;

      const dayName = getDayName(date);
      const hour = date.getHours();
      const weekOfMonth = getWeekOfMonth(date);
      const month = date.getMonth() + 1; // 1-12
      const quarter = getQuarter(date);
      const year = date.getFullYear();

      // Peak hours by day of week
      if (!hoursByDay[dayName]) {
        hoursByDay[dayName] = {};
      }
      if (!hoursByDay[dayName][hour]) {
        hoursByDay[dayName][hour] = 0;
      }
      hoursByDay[dayName][hour]++;

      // Day of week counts
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;

      // Week of month counts
      const weekKey = `${year}-${month}-W${weekOfMonth}`;
      weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;

      // Month of quarter counts
      const monthOfQuarterKey = `${year}-Q${quarter}-M${month}`;
      monthOfQuarterCounts[monthOfQuarterKey] = (monthOfQuarterCounts[monthOfQuarterKey] || 0) + 1;

      // Month of year counts
      const monthOfYearKey = `${year}-M${month}`;
      monthOfYearCounts[monthOfYearKey] = (monthOfYearCounts[monthOfYearKey] || 0) + 1;

      // Quarter of year counts
      const quarterOfYearKey = `${year}-Q${quarter}`;
      quarterOfYearCounts[quarterOfYearKey] = (quarterOfYearCounts[quarterOfYearKey] || 0) + 1;
    });

    // Find peak hours by day (top hour for each day)
    const peakHoursByDay: { [day: string]: { hour: number; count: number }[] } = {};
    Object.keys(hoursByDay).forEach(day => {
      const hours = Object.entries(hoursByDay[day])
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3); // Top 3 hours per day
      peakHoursByDay[day] = hours;
    });

    // Calculate peak hours data for line graph (8am-4pm)
    const peakHoursData: { hour: number; count: number }[] = [];
    const allHoursCount: { [hour: number]: number } = {};
    branchTickets.forEach(ticket => {
      const hour = new Date(ticket.joinedAt).getHours();
      if (hour >= 8 && hour <= 16) {
        allHoursCount[hour] = (allHoursCount[hour] || 0) + 1;
      }
    });
    for (let hour = 8; hour <= 16; hour++) {
      peakHoursData.push({
        hour,
        count: allHoursCount[hour] || 0
      });
    }

    // Find peak day of week
    const peakDayEntry = Object.entries(dayCounts)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.count - a.count)[0];

    // Find peak week of month
    const peakWeekEntry = Object.entries(weekCounts)
      .map(([key, count]) => {
        const [year, month, week] = key.split(/[-W]/);
        return { week: parseInt(week), month: parseInt(month), year: parseInt(year), count };
      })
      .sort((a, b) => b.count - a.count)[0];

    // Find peak month of quarter
    const peakMonthOfQuarterEntry = Object.entries(monthOfQuarterCounts)
      .map(([key, count]) => {
        const parts = key.split('-');
        const year = parseInt(parts[0]);
        const quarter = parseInt(parts[1].substring(1));
        const month = parseInt(parts[2].substring(1));
        return { month, quarter, year, count };
      })
      .sort((a, b) => b.count - a.count)[0];

    // Find peak month of year
    const peakMonthOfYearEntry = Object.entries(monthOfYearCounts)
      .map(([key, count]) => {
        const [year, month] = key.split('-M');
        return { month: parseInt(month), year: parseInt(year), count };
      })
      .sort((a, b) => b.count - a.count)[0];

    // Find peak quarter of year
    const peakQuarterOfYearEntry = Object.entries(quarterOfYearCounts)
      .map(([key, count]) => {
        const [year, quarter] = key.split('-Q');
        return { quarter: parseInt(quarter), year: parseInt(year), count };
      })
      .sort((a, b) => b.count - a.count)[0];

    // Calculate averages
    if (!earliestDate || !latestDate) {
      return null;
    }

    const daysDiff = Math.max(1, Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const weeksDiff = Math.max(1, daysDiff / 7);
    const monthsDiff = Math.max(1, (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 + 
      (latestDate.getMonth() - earliestDate.getMonth()) + 1);
    const quartersDiff = Math.max(1, (latestDate.getFullYear() - earliestDate.getFullYear()) * 4 + 
      (getQuarter(latestDate) - getQuarter(earliestDate)) + 1);
    const yearsDiff = Math.max(1, latestDate.getFullYear() - earliestDate.getFullYear() + 1);

    const averages = {
      perDay: branchTickets.length / daysDiff,
      perWeek: branchTickets.length / weeksDiff,
      perMonth: branchTickets.length / monthsDiff,
      perQuarter: branchTickets.length / quartersDiff,
      perYear: branchTickets.length / yearsDiff,
    };

    return {
      peakHoursByDay,
      peakHoursData,
      peakDayOfWeek: peakDayEntry,
      peakWeekOfMonth: peakWeekEntry,
      peakMonthOfQuarter: peakMonthOfQuarterEntry,
      peakMonthOfYear: peakMonthOfYearEntry,
      peakQuarterOfYear: peakQuarterOfYearEntry,
      averages,
    } as PeakAnalytics;
  }, [tickets, branch.id]);

  if (!analytics) {
    return null; // Will auto-generate mock data via useEffect
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 size={32} className="text-blue-600" />
        <h2 className="text-3xl font-black text-slate-800">Analytics Dashboard</h2>
      </div>

      {/* Peak Hours Line Graph */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Clock size={20} /> Peak Hours (8 AM - 4 PM)
        </h3>
        <PeakHoursLineGraph data={analytics.peakHoursData} />
      </div>

      {/* Peak Periods */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} /> Peak Day of Week
          </h3>
          <div className="space-y-2">
            <p className="text-3xl font-black text-blue-600">{analytics.peakDayOfWeek.day}</p>
            <p className="text-sm text-slate-500">{analytics.peakDayOfWeek.count} customers</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={20} /> Peak Week of Month
          </h3>
          <div className="space-y-2">
            <p className="text-3xl font-black text-blue-600">Week {analytics.peakWeekOfMonth.week}</p>
            <p className="text-sm text-slate-500">
              {monthNames[analytics.peakWeekOfMonth.month - 1]} {analytics.peakWeekOfMonth.year}
            </p>
            <p className="text-sm text-slate-500">{analytics.peakWeekOfMonth.count} customers</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={20} /> Peak Month of Quarter
          </h3>
          <div className="space-y-2">
            <p className="text-3xl font-black text-blue-600">
              {monthNames[analytics.peakMonthOfQuarter.month - 1]}
            </p>
            <p className="text-sm text-slate-500">
              Q{analytics.peakMonthOfQuarter.quarter} {analytics.peakMonthOfQuarter.year}
            </p>
            <p className="text-sm text-slate-500">{analytics.peakMonthOfQuarter.count} customers</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={20} /> Peak Month of Year
          </h3>
          <div className="space-y-2">
            <p className="text-3xl font-black text-blue-600">
              {monthNames[analytics.peakMonthOfYear.month - 1]}
            </p>
            <p className="text-sm text-slate-500">{analytics.peakMonthOfYear.year}</p>
            <p className="text-sm text-slate-500">{analytics.peakMonthOfYear.count} customers</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={20} /> Peak Quarter of Year
          </h3>
          <div className="space-y-2">
            <p className="text-3xl font-black text-blue-600">Q{analytics.peakQuarterOfYear.quarter}</p>
            <p className="text-sm text-slate-500">{analytics.peakQuarterOfYear.year}</p>
            <p className="text-sm text-slate-500">{analytics.peakQuarterOfYear.count} customers</p>
          </div>
        </div>
      </div>

      {/* Average Customers */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart3 size={20} /> Average Customers
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Per Day</p>
            <p className="text-2xl font-black text-blue-600">{analytics.averages.perDay.toFixed(1)}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Per Week</p>
            <p className="text-2xl font-black text-blue-600">{analytics.averages.perWeek.toFixed(1)}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Per Month</p>
            <p className="text-2xl font-black text-blue-600">{analytics.averages.perMonth.toFixed(1)}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Per Quarter</p>
            <p className="text-2xl font-black text-blue-600">{analytics.averages.perQuarter.toFixed(1)}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Per Year</p>
            <p className="text-2xl font-black text-blue-600">{analytics.averages.perYear.toFixed(1)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Line Graph Component for Peak Hours
interface PeakHoursLineGraphProps {
  data: { hour: number; count: number }[];
}

const PeakHoursLineGraph: React.FC<PeakHoursLineGraphProps> = ({ data }) => {
  const width = 800;
  const height = 300;
  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const minCount = 0;

  // Convert hour to label (8 -> "8 AM", 12 -> "12 PM", 16 -> "4 PM")
  const formatHour = (hour: number): string => {
    if (hour === 12) return '12 PM';
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  // Calculate points for the line
  const points = data.map((d, index) => {
    const x = padding.left + (index / (data.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((d.count - minCount) / (maxCount - minCount || 1)) * graphHeight;
    return { x, y, hour: d.hour, count: d.count };
  });

  // Create path for the line
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="mx-auto">
        {/* Y-axis label */}
        <text
          x={padding.left / 2}
          y={padding.top + graphHeight / 2}
          textAnchor="middle"
          className="text-xs fill-slate-600"
          transform={`rotate(-90 ${padding.left / 2} ${padding.top + graphHeight / 2})`}
        >
          Number of Customers
        </text>

        {/* X-axis label */}
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          className="text-xs fill-slate-600"
        >
          Hours
        </text>

        {/* Grid lines and Y-axis labels */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const value = Math.round((maxCount / 5) * i);
          const y = padding.top + graphHeight - (i / 5) * graphHeight;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-slate-500"
              >
                {value}
              </text>
            </g>
          );
        })}

        {/* X-axis labels (hours) */}
        {data.map((d, index) => {
          const x = padding.left + (index / (data.length - 1)) * graphWidth;
          return (
            <text
              key={d.hour}
              x={x}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-slate-500"
            >
              {formatHour(d.hour)}
            </text>
          );
        })}

        {/* Grid lines for X-axis */}
        {data.map((d, index) => {
          const x = padding.left + (index / (data.length - 1)) * graphWidth;
          return (
            <line
              key={d.hour}
              x1={x}
              y1={padding.top}
              x2={x}
              y2={height - padding.bottom}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}

        {/* Line path */}
        <path
          d={pathData}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
            />
            {/* Tooltip on hover */}
            <title>{`${formatHour(point.hour)}: ${point.count} customers`}</title>
          </g>
        ))}

        {/* Axes */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#64748b"
          strokeWidth="2"
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#64748b"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

export default ManagerDashboard;
