export function minutesToDisplay(minutes: number): string {
  if (minutes === 0) return '0h';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `0h${String(mins).padStart(2, '0')}`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${String(mins).padStart(2, '0')}`;
}
