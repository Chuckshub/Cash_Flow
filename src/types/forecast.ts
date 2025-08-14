export interface WeeklyForecast {
  weekNumber: number;
  weekStart: string; // ISO date string
  weekEnd: string; // ISO date string
  weekLabel: string; // "Week of Jan 15"
  predictedInflows: number;
  predictedOutflows: number;
  actualInflows: number;
  actualOutflows: number;
  netForecast: number;
  netActual: number;
  variance: number; // actual - forecast
  hasActualData: boolean;
}

export interface ForecastInput {
  weekNumber: number;
  inflows: number;
  outflows: number;
  notes?: string;
}

export interface ForecastSummary {
  totalForecastInflows: number;
  totalForecastOutflows: number;
  totalActualInflows: number;
  totalActualOutflows: number;
  totalForecastNet: number;
  totalActualNet: number;
  totalVariance: number;
  accuracy: number; // percentage
}

// Utility functions for forecast calculations
export function getWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

export function getWeekEnd(weekStart: Date): Date {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Saturday
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

export function generateNext13Weeks(startDate: Date = new Date()): WeeklyForecast[] {
  const weeks: WeeklyForecast[] = [];
  const currentWeekStart = getWeekStart(startDate);
  
  for (let i = 0; i < 13; i++) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() + (i * 7));
    const weekEnd = getWeekEnd(weekStart);
    
    weeks.push({
      weekNumber: i + 1,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      weekLabel: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      predictedInflows: 0,
      predictedOutflows: 0,
      actualInflows: 0,
      actualOutflows: 0,
      netForecast: 0,
      netActual: 0,
      variance: 0,
      hasActualData: false
    });
  }
  
  return weeks;
}

export function isDateInWeek(date: string, weekStart: string, weekEnd: string): boolean {
  const checkDate = new Date(date);
  const startDate = new Date(weekStart);
  const endDate = new Date(weekEnd);
  
  return checkDate >= startDate && checkDate <= endDate;
}