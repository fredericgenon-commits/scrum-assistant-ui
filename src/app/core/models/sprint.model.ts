export interface Sprint {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  velocity: number | null;
  teamId: number | null;
  teamName: string | null;
}
