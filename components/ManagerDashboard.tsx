import React, { useMemo } from 'react';
import { Ticket, BranchConfig } from '../types';
import { BarChart3, TrendingUp, Calendar, Clock } from 'lucide-react';

interface ManagerDashboardProps {
  tickets: Ticket[];
  branch: BranchConfig;
}

interface PeakAnalytics {
  peakHoursByDay: { [day: string]: { hour: number; count: number }[] };
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

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ tickets, branch }) => {
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
      peakDayOfWeek: peakDayEntry,
      peakWeekOfMonth: peakWeekEntry,
      peakMonthOfQuarter: peakMonthOfQuarterEntry,
      peakMonthOfYear: peakMonthOfYearEntry,
      peakQuarterOfYear: peakQuarterOfYearEntry,
      averages,
    } as PeakAnalytics;
  }, [tickets, branch.id]);

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No data available yet</p>
      </div>
    );
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 size={32} className="text-blue-600" />
        <h2 className="text-3xl font-black text-slate-800">Analytics Dashboard</h2>
      </div>

      {/* Peak Hours by Day of Week */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Clock size={20} /> Peak Hours by Day of Week
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dayOrder.map(day => {
            const hours = analytics.peakHoursByDay[day] || [];
            if (hours.length === 0) return null;
            return (
              <div key={day} className="p-4 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-800 mb-2">{day}</p>
                <div className="space-y-1">
                  {hours.map(({ hour, count }) => (
                    <div key={hour} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{hour}:00</span>
                      <span className="font-bold text-slate-800">{count} customers</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
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

export default ManagerDashboard;
