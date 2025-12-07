
export function getTodayString(): string {
  const today = new Date();
  return formatDate(today);
}

export function formatDate(date: Date): string {
  // Ensure we're working with a valid date
  if (!date || isNaN(date.getTime())) {
    console.error('Invalid date provided to formatDate:', date);
    return formatDate(new Date());
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateString: string): Date {
  // Handle invalid date strings
  if (!dateString) {
    console.error('Empty date string provided to parseDate');
    return new Date();
  }
  
  const date = new Date(dateString + 'T00:00:00');
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.error('Invalid date string provided to parseDate:', dateString);
    return new Date();
  }
  
  return date;
}

export function getWeekStart(date: Date): Date {
  // Ensure we have a valid date
  if (!date || isNaN(date.getTime())) {
    console.error('Invalid date provided to getWeekStart:', date);
    date = new Date();
  }

  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const weekStart = new Date(d.setDate(diff));
  
  // Reset time to start of day
  weekStart.setHours(0, 0, 0, 0);
  
  return weekStart;
}

export function getMonthStart(date: Date): Date {
  // Ensure we have a valid date
  if (!date || isNaN(date.getTime())) {
    console.error('Invalid date provided to getMonthStart:', date);
    date = new Date();
  }

  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  
  // Reset time to start of day
  monthStart.setHours(0, 0, 0, 0);
  
  return monthStart;
}

export function getWeekStartDate(): string {
  const today = new Date();
  const weekStart = getWeekStart(today);
  return formatDate(weekStart);
}

export function getMonthStartDate(): string {
  const today = new Date();
  const monthStart = getMonthStart(today);
  return formatDate(monthStart);
}

export function formatDisplayDate(dateString: string): string {
  const date = parseDate(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (formatDate(date) === formatDate(today)) {
    return 'Today';
  } else if (formatDate(date) === formatDate(yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
}
