export interface Team {
  id: number;
  name: string;
  scrumMasterId: number | null;
  scrumMasterName: string | null;
  timeLogThreshold: number | null;
  startHour: string | null;
}
