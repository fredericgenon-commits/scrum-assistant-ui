export interface TimeLogReport {
  developerId: number;
  developerName: string;
  totalMinutes: number;
  occupation: number | null;
  details: TimeLogDetail[];
}

export interface TimeLogDetail {
  ticketKey: string;
  summary: string;
  requirement: string;
  project: string;
  deliveryMethod: string;
  minutes: number;
}

export interface DeveloperDailyReport {
  developerId: number;
  developerName: string;
  entries: DailyTimeEntry[];
}

export interface DailyTimeEntry {
  ticketKey: string;
  summary: string;
  project: string | null;
  epic: string | null;
  deliveryMethod: string | null;
  date: string;
  minutes: number;
}
