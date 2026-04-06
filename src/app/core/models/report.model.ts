export interface TimeLogReport {
  developerId: number;
  developerName: string;
  totalMinutes: number;
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
