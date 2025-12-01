// src/types/db.ts

export interface KnowledgeType {
  id: number;
  name: string;
  code: string;
}

export interface Knowledge {
  id: number;
  name: string;
  description: string | null;
  type_id: number;
  created_at: Date;
}

export interface KnowledgeListItem extends Knowledge {
  type_name: string;
  file_count: number; // 统计出的文件总数
  chunk_count: number; // 统计出的切片总数
}

// 前端表单提交的数据结构
export interface CreateKnowledgeDTO {
  name: string;
  description: string;
  typeId: number;
  // 文件通过 FormData 传输，不在此 JSON 接口中直接体现
}