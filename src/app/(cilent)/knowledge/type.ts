export interface KnowledgeFormValues {
  name: string;
  category?: number;
  description?: string;
}

export interface KnowledgeItem extends KnowledgeFormValues {
  id: number;
  fileNum: number;
}
