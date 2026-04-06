export type DeliveryMethod = 'PROJECT' | 'IMPROVEMENT' | 'IT';

export interface JiraTicket {
  id: number;
  key: string;
  summary: string;
  requirement: string;
  deliveryMethod: DeliveryMethod;
  project: string;
  timeLogs: TimeLogEntry[];
}

export interface TimeLogEntry {
  id: number;
  developerId: number;
  developerName: string;
  jiraTicketId: number;
  jiraTicketKey: string;
  timeSpentMinutes: number;
}
