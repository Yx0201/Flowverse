import { UploadFile } from "antd/es/upload/interface";

export interface KnowledgeFormValues {
  name: string;
  type?: number;
  description?: string;
  fileList: UploadFile[];
}

export interface KnowledgeItem {
  id: number;
  name: string;
  description: string;
  type_id: number;
  type_name: string;
  file_count: number;
  chunk_count: number;
  created_at: string;
}
