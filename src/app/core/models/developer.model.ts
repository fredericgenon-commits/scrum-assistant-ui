export interface Developer {
  id: number;
  name: string;
  displayName: string;
  jiraKey: string;
  teamId: number | null;
  teamName: string | null;
}
