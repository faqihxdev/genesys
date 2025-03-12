export interface Funnel {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  projectId: string;
}
