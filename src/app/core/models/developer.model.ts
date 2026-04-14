export interface Developer {
  id: number;
  name: string;
  displayName: string;
  jiraKey: string;
  occupation: number | null;
  teamId: number | null;
  teamName: string | null;
}
