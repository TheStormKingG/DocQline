import React, { useMemo, useEffect, useState, useRef } from 'react';
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
  peakDaysData: { day: string; count: number }[]; // For line graph (Mon-Fri)
  peakMonthsData: { month: number; count: number }[]; // For line graph (Jan-Dec)
  peakDayOfWeek: { day: string; count: number };
  peakWeekOfMonth: { week: number; month: number; year: number; count: number };
  peakMonthOfQuarter: { month: number; quarter: number; year: number; count: number };
  peakMonthOfYear: { month: number; year: number; count: number };
  peakQuarterOfYear: { quarter: number; year: number; count: number };
  averages: {
    waitTime: number; // Average wait time in minutes
    customersPerDay: number;
    noShowsPerDay: number;
  };
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ tickets, branch, onAddMockData }) => {
  const [graphView, setGraphView] = useState<'hours' | 'days' | 'months'>('hours');
  const [activeTab, setActiveTab] = useState<'data' | 'analytics'>('analytics');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
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

    // Calculate peak days data for line graph (Mon-Fri)
    const peakDaysData: { day: string; count: number }[] = [];
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    dayOrder.forEach(day => {
      peakDaysData.push({
        day,
        count: dayCounts[day] || 0
      });
    });

    // Calculate peak months data for line graph (Jan-Dec)
    const peakMonthsData: { month: number; count: number }[] = [];
    const monthCounts: { [month: number]: number } = {};
    branchTickets.forEach(ticket => {
      const month = new Date(ticket.joinedAt).getMonth() + 1; // 1-12
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    for (let month = 1; month <= 12; month++) {
      peakMonthsData.push({
        month,
        count: monthCounts[month] || 0
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
    
    // Calculate average wait time
    const ticketsWithWaitTime = branchTickets.filter(t => t.waitTimeMinutes !== undefined);
    const avgWaitTime = ticketsWithWaitTime.length > 0
      ? ticketsWithWaitTime.reduce((sum, t) => sum + (t.waitTimeMinutes || 0), 0) / ticketsWithWaitTime.length
      : 0;

    // Calculate average customers per day
    const avgCustomersPerDay = branchTickets.length / daysDiff;

    // Calculate average no-shows per day
    const noShowTickets = branchTickets.filter(t => t.isNoShow === true);
    const avgNoShowsPerDay = noShowTickets.length / daysDiff;

    const averages = {
      waitTime: Math.round(avgWaitTime * 10) / 10, // Round to 1 decimal
      customersPerDay: Math.round(avgCustomersPerDay * 10) / 10,
      noShowsPerDay: Math.round(avgNoShowsPerDay * 10) / 10,
    };

    return {
      peakHoursByDay,
      peakHoursData,
      peakDaysData,
      peakMonthsData,
      peakDayOfWeek: peakDayEntry,
      peakWeekOfMonth: peakWeekEntry,
      peakMonthOfQuarter: peakMonthOfQuarterEntry,
      peakMonthOfYear: peakMonthOfYearEntry,
      peakQuarterOfYear: peakQuarterOfYearEntry,
      averages,
    } as PeakAnalytics;
  }, [tickets, branch.id]);

  // Must be declared before any early return to satisfy Rules of Hooks
  const selectedDateData = useMemo(() => {
    const branchTickets = tickets.filter(t => t.branchId === branch.id);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dayTickets = branchTickets.filter(t => {
      const ticketDate = new Date(t.joinedAt);
      return ticketDate >= startOfDay && ticketDate <= endOfDay;
    });

    const hourCounts: { [hour: number]: number } = {};
    let totalWaitTime = 0;
    let noShows = 0;

    dayTickets.forEach(ticket => {
      const hour = new Date(ticket.joinedAt).getHours();
      if (hour >= 8 && hour <= 16) {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
      if (ticket.waitTimeMinutes !== undefined) {
        totalWaitTime += ticket.waitTimeMinutes;
      }
      if (ticket.isNoShow === true) {
        noShows++;
      }
    });

    const peakHours = [];
    for (let hour = 8; hour <= 16; hour++) {
      peakHours.push({ hour, count: hourCounts[hour] || 0 });
    }

    return {
      totalCustomers: dayTickets.length,
      peakHours,
      cumulativeWaitTime: totalWaitTime,
      totalNoShows: noShows
    };
  }, [tickets, branch.id, selectedDate]);

  if (!analytics) {
    return null; // useEffect above will auto-generate mock data and trigger re-render
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-5" data-tour="manager-dashboard">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(145deg, #0071E3, #34AADC)' }}>
            <BarChart3 size={18} className="text-white" />
          </div>
          <h2 className="text-[20px] font-semibold text-[#1D1D1F] tracking-tight">Clinic Analytics</h2>
        </div>

        {/* Segmented tabs */}
        <div className="flex items-center gap-[2px] p-[3px] rounded-[11px]"
          style={{ background: 'rgba(0,0,0,0.05)' }}>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-4 py-1.5 rounded-[8px] text-[13px] font-medium transition-all duration-200 ${
              activeTab === 'data' ? 'text-[#0071E3]' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
            style={activeTab === 'data' ? {
              background: '#FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.06)',
            } : undefined}
            data-tour="manager-data-tab"
          >
            Data
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-1.5 rounded-[8px] text-[13px] font-medium transition-all duration-200 ${
              activeTab === 'analytics' ? 'text-[#0071E3]' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
            style={activeTab === 'analytics' ? {
              background: '#FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.06)',
            } : undefined}
          >
            Analytics
          </button>
        </div>
      </div>

      {activeTab === 'data' ? (
        <DataView 
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          data={selectedDateData}
        />
      ) : (
        <AnalyticsView 
          analytics={analytics}
          graphView={graphView}
          setGraphView={setGraphView}
          monthNames={monthNames}
        />
      )}
    </div>
  );
};

// Data View Component
interface DataViewProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  data: {
    totalCustomers: number;
    peakHours: { hour: number; count: number }[];
    cumulativeWaitTime: number;
    totalNoShows: number;
  };
}

const DataView: React.FC<DataViewProps> = ({ selectedDate, setSelectedDate, data }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const calendarRef = useRef<HTMLDivElement>(null);

  const formatDateShort = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  // Calendar functions
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
    setShowCalendar(false);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setShowCalendar(false);
  };

  const handleClear = () => {
    const today = new Date();
    setSelectedDate(today);
    setShowCalendar(false);
  };

  // Generate calendar days
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const isSelectedDate = (day: number | null) => {
    if (day === null) return false;
    return selectedDate.getDate() === day &&
           selectedDate.getMonth() === currentMonth &&
           selectedDate.getFullYear() === currentYear;
  };

  const isToday = (day: number | null) => {
    if (day === null) return false;
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === currentMonth &&
           today.getFullYear() === currentYear;
  };

  return (
    <>
      {/* Peak Hours Line Graph */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-semibold text-[#1D1D1F] flex items-center gap-2">
            <Clock size={16} className="text-[#0071E3]" /> Peak Hours (8 AM – 4 PM)
          </h3>
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium text-[#3C3C43] bg-[#F5F5F7] hover:bg-[#EBEBF0] transition-all"
              data-tour="manager-date-picker"
            >
              <Calendar size={14} className="text-[#0071E3]" />
              {formatDateShort(selectedDate)}
            </button>
            {showCalendar && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl z-50 w-80 p-4"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.05)' }}>
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-3">
                  <button onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg hover:bg-[#F5F5F7] text-[#6E6E73] text-lg leading-none transition-all">
                    ‹
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-semibold text-[#1D1D1F]">{monthNames[currentMonth]}</span>
                    <span className="text-[14px] text-[#8E8E93]">{currentYear}</span>
                  </div>
                  <button onClick={handleNextMonth}
                    className="p-1.5 rounded-lg hover:bg-[#F5F5F7] text-[#6E6E73] text-lg leading-none transition-all">
                    ›
                  </button>
                </div>
                {/* Day Names */}
                <div className="grid grid-cols-7 gap-1 mb-1.5">
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-[11px] font-semibold text-[#AEAEB2] py-1">
                      {day}
                    </div>
                  ))}
                </div>
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => day !== null && handleDateSelect(day)}
                      disabled={day === null}
                      className={`py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                        day === null ? 'cursor-default' : 'cursor-pointer'
                      } ${isSelectedDate(day)
                          ? 'bg-[#0071E3] text-white'
                          : isToday(day)
                          ? 'bg-[#EBF5FF] text-[#0071E3] font-semibold'
                          : day !== null ? 'text-[#1D1D1F] hover:bg-[#F5F5F7]' : ''
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                {/* Footer */}
                <div className="flex justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <button onClick={handleClear}
                    className="text-[13px] text-[#0071E3] hover:text-[#0077ED] font-medium">
                    Clear
                  </button>
                  <button onClick={handleToday}
                    className="text-[13px] text-[#0071E3] hover:text-[#0077ED] font-medium">
                    Today
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <PeakHoursLineGraph data={data.peakHours} type="hours" />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider mb-3">Total Patients</p>
          <p className="text-[32px] font-bold text-[#0071E3] tabular-nums leading-none">{data.totalCustomers}</p>
          <p className="text-[13px] text-[#8E8E93] mt-1">patients</p>
        </div>

        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider mb-3">Cumulative Wait</p>
          <p className="text-[32px] font-bold text-[#0071E3] tabular-nums leading-none">{data.cumulativeWaitTime}</p>
          <p className="text-[13px] text-[#8E8E93] mt-1">minutes</p>
        </div>

        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider mb-3">Total No-Shows</p>
          <p className="text-[32px] font-bold text-[#0071E3] tabular-nums leading-none">{data.totalNoShows}</p>
          <p className="text-[13px] text-[#8E8E93] mt-1">no-shows</p>
        </div>
      </div>
    </>
  );
};

// Analytics View Component
interface AnalyticsViewProps {
  analytics: PeakAnalytics;
  graphView: 'hours' | 'days' | 'months';
  setGraphView: (view: 'hours' | 'days' | 'months') => void;
  monthNames: string[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics, graphView, setGraphView, monthNames }) => {
  return (
    <>
      {/* Peak Hours/Days/Months Line Graph */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }} data-tour="manager-graph">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-semibold text-[#1D1D1F] flex items-center gap-2">
            <TrendingUp size={16} className="text-[#0071E3]" />
            {graphView === 'hours' && 'Peak Hours (8 AM – 4 PM)'}
            {graphView === 'days' && 'Peak Day (Mon – Fri)'}
            {graphView === 'months' && 'Peak Month (Jan – Dec)'}
          </h3>
          <select
            value={graphView}
            onChange={(e) => setGraphView(e.target.value as 'hours' | 'days' | 'months')}
            className="px-3.5 py-2 rounded-xl text-[13px] font-medium text-[#3C3C43] bg-[#F5F5F7] outline-none cursor-pointer hover:bg-[#EBEBF0] transition-all border-0"
          >
            <option value="hours">Peak Hours (8 AM – 4 PM)</option>
            <option value="days">Peak Day (Mon – Fri)</option>
            <option value="months">Peak Month (Jan – Dec)</option>
          </select>
        </div>
        {graphView === 'hours' && <PeakHoursLineGraph data={analytics.peakHoursData} type="hours" />}
        {graphView === 'days' && <PeakHoursLineGraph data={analytics.peakDaysData} type="days" />}
        {graphView === 'months' && <PeakHoursLineGraph data={analytics.peakMonthsData} type="months" />}
      </div>

      {/* Averages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-tour="manager-averages">
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider mb-3">Avg Wait Time</p>
          <p className="text-[32px] font-bold text-[#0071E3] tabular-nums leading-none">
            {analytics.averages.waitTime.toFixed(1)}
          </p>
          <p className="text-[13px] text-[#8E8E93] mt-1">minutes</p>
        </div>

        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider mb-3">Avg Patients / Day</p>
          <p className="text-[32px] font-bold text-[#0071E3] tabular-nums leading-none">
            {analytics.averages.customersPerDay.toFixed(1)}
          </p>
          <p className="text-[13px] text-[#8E8E93] mt-1">patients</p>
        </div>

        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider mb-3">Avg No-Shows / Day</p>
          <p className="text-[32px] font-bold text-[#0071E3] tabular-nums leading-none">
            {analytics.averages.noShowsPerDay.toFixed(1)}
          </p>
          <p className="text-[13px] text-[#8E8E93] mt-1">no-shows</p>
        </div>
      </div>

      {/* Peak Periods */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider mb-3">Peak Month of Year</p>
          <p className="text-[24px] font-semibold text-[#1D1D1F] leading-tight">
            {monthNames[analytics.peakMonthOfYear.month - 1]}
          </p>
          <p className="text-[13px] text-[#8E8E93] mt-1">{analytics.peakMonthOfYear.year}</p>
          <p className="text-[12px] text-[#AEAEB2]">{analytics.peakMonthOfYear.count} patients</p>
        </div>

        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider mb-3">Peak Quarter of Year</p>
          <p className="text-[24px] font-semibold text-[#1D1D1F] leading-tight">
            Q{analytics.peakQuarterOfYear.quarter}
          </p>
          <p className="text-[13px] text-[#8E8E93] mt-1">{analytics.peakQuarterOfYear.year}</p>
          <p className="text-[12px] text-[#AEAEB2]">{analytics.peakQuarterOfYear.count} patients</p>
        </div>
      </div>
    </>
  );
};

// Line Graph Component for Peak Hours/Days/Months
interface PeakHoursLineGraphProps {
  data: { hour?: number; day?: string; month?: number; count: number }[];
  type: 'hours' | 'days' | 'months';
}

const PeakHoursLineGraph: React.FC<PeakHoursLineGraphProps> = ({ data, type }) => {
  const width = 800;
  const height = 300;
  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const minCount = 0;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Format label based on type
  const formatLabel = (item: { hour?: number; day?: string; month?: number }): string => {
    if (type === 'hours' && item.hour !== undefined) {
      if (item.hour === 12) return '12 PM';
      if (item.hour > 12) return `${item.hour - 12} PM`;
      return `${item.hour} AM`;
    }
    if (type === 'days' && item.day !== undefined) {
      return item.day.substring(0, 3); // Mon, Tue, etc.
    }
    if (type === 'months' && item.month !== undefined) {
      return monthNames[item.month - 1];
    }
    return '';
  };

  // Get value for tooltip
  const getTooltipValue = (item: { hour?: number; day?: string; month?: number; count: number }): string => {
    if (type === 'hours' && item.hour !== undefined) {
      return `${formatLabel(item)}: ${item.count} patients`;
    }
    if (type === 'days' && item.day !== undefined) {
      return `${item.day}: ${item.count} patients`;
    }
    if (type === 'months' && item.month !== undefined) {
      return `${monthNames[item.month - 1]}: ${item.count} patients`;
    }
    return `${item.count} patients`;
  };

  // Calculate points for the line
  const points = data.map((d, index) => {
    const x = padding.left + (index / (data.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((d.count - minCount) / (maxCount - minCount || 1)) * graphHeight;
    return { x, y, ...d, count: d.count };
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
          Number of Patients
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
                stroke="rgba(0,0,0,0.06)"
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

        {/* X-axis labels */}
        {data.map((d, index) => {
          const x = padding.left + (index / (data.length - 1)) * graphWidth;
          return (
            <text
              key={index}
              x={x}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-slate-500"
            >
              {formatLabel(d)}
            </text>
          );
        })}

        {/* Grid lines for X-axis */}
        {data.map((d, index) => {
          const x = padding.left + (index / (data.length - 1)) * graphWidth;
          return (
            <line
              key={index}
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
            <title>{getTooltipValue(point)}</title>
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
