// src/app/api/knowledge/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// BGE-M3 向量化函数 - 使用本地Ollama
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch("http://localhost:11434/api/embed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "bge-m3",
        input: text,
      }),
    });
    console.log(response, "response");
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.embeddings[0]; // 返回第一个embedding向量
  } catch (error) {
    console.error("生成向量时出错:", error);
    throw new Error("向量化失败");
  }
}

// 智能文本切分函数 - 按段落和句子边界切分
function splitTextIntoChunks(
  text: string,
  maxChunkSize: number = 800
): string[] {
  // 清理文本，移除多余的空白字符
  const cleanText = text.replace(/\s+/g, " ").trim();

  if (cleanText.length <= maxChunkSize) {
    return [cleanText];
  }

  const chunks: string[] = [];
  let currentChunk = "";

  // 按句子分割
  const sentences = cleanText.split(/[.!?。！？]+/);

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    // 如果当前句子加入后会超过最大长度，先保存当前块
    if (
      currentChunk.length + trimmedSentence.length + 1 > maxChunkSize &&
      currentChunk
    ) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      currentChunk += (currentChunk ? ". " : "") + trimmedSentence;
    }
  }

  // 添加最后一个块
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [cleanText];
}

export async function POST(req: NextRequest) {
  const client = await pool.connect();

  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const typeId = parseInt(formData.get("type") as string);
    const files = formData.getAll("files") as File[];

    if (!name || !typeId || files.length === 0) {
      return NextResponse.json(
        { error: "缺少必填字段：名称、类型和文件不能为空" },
        { status: 400 }
      );
    }

    // 开启事务
    await client.query("BEGIN");

    // 1. 插入 Knowledge 表
    const insertKnowledgeQuery = `
      INSERT INTO knowledge (name, description, type_id)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const knowledgeResult = await client.query(insertKnowledgeQuery, [
      name,
      description,
      typeId,
    ]);
    const knowledgeId = knowledgeResult.rows[0].id;

    // 2. 处理文件 -> 切片 -> 向量化 -> 存入 KnowledgeFile 表
    for (const file of files) {
      try {
        let fileContent: string;

        // 根据文件类型读取内容
        if (file.type === "application/pdf") {
          // 对于PDF文件，这里可以添加PDF解析逻辑
          throw new Error("暂不支持PDF文件，请使用文本文件");
        } else {
          // 对于文本文件，直接读取内容
          fileContent = await file.text();
        }

        if (!fileContent.trim()) {
          console.warn(`文件 ${file.name} 内容为空，跳过处理`);
          continue;
        }

        const chunks = splitTextIntoChunks(fileContent);
        console.log(`文件 ${file.name} 切分为 ${chunks.length} 个片段`);

        for (let i = 0; i < chunks.length; i++) {
          const chunkText = chunks[i];

          if (!chunkText.trim()) continue;

          try {
            const vector = await generateEmbedding(chunkText);

            // pgvector 存入格式为字符串: "[0.1, 0.2, ...]"
            const vectorString = JSON.stringify(vector);

            const insertFileQuery = `
              INSERT INTO knowledge_file (knowledge_id, source_filename, chunk_content, chunk_vector, chunk_index)
              VALUES ($1, $2, $3, $4, $5)
            `;
            await client.query(insertFileQuery, [
              knowledgeId,
              file.name,
              chunkText,
              vectorString,
              i,
            ]);
          } catch (embeddingError) {
            console.error(
              `处理文件 ${file.name} 第 ${i + 1} 个片段时出错:`,
              embeddingError
            );
            // 跳过这个片段，继续处理其他片段
            continue;
          }
        }
      } catch (fileError) {
        console.error(`处理文件 ${file.name} 时出错:`, fileError);
        // 跳过这个文件，继续处理其他文件
        continue;
      }
    }

    await client.query("COMMIT");

    return NextResponse.json(
      {
        message: "知识库创建成功",
        id: knowledgeId,
        message_en: "Knowledge base created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating knowledge base:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// 获取知识库列表（带搜索和分页）
export async function GET(req: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '12');
    const offset = (page - 1) * pageSize;

    // 构建基础查询
    let whereClause = '1=1';
    const params: (string | number)[] = [];

    // 添加搜索条件
    if (search.trim()) {
      whereClause += ` AND (
        k.name ILIKE $${params.length + 1} OR
        k.description ILIKE $${params.length + 1} OR
        kt.name ILIKE $${params.length + 1}
      )`;
      params.push(`%${search.trim()}%`);
    }

    // 获取总数查询
    const countQuery = `
      SELECT COUNT(DISTINCT k.id) as total
      FROM knowledge k
      LEFT JOIN knowledge_type kt ON k.type_id = kt.id
      WHERE ${whereClause}
    `;

    // 获取数据查询
    const dataQuery = `
      SELECT
        k.id,
        k.name,
        k.description,
        k.created_at,
        kt.name as type_name,
        COUNT(DISTINCT kf.source_filename) as file_count,
        COUNT(kf.id) as chunk_count
      FROM knowledge k
      LEFT JOIN knowledge_type kt ON k.type_id = kt.id
      LEFT JOIN knowledge_file kf ON k.id = kf.knowledge_id
      WHERE ${whereClause}
      GROUP BY k.id, kt.name
      ORDER BY k.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    // 添加分页参数
    params.push(pageSize, offset);

    // 并发执行查询
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params.slice(0, -2)), // 只传递搜索参数
      pool.query(dataQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].total);

    // 转换 bigint (Postgres COUNT 返回类型) 为 number
    const rows = dataResult.rows.map((row) => ({
      ...row,
      file_count: Number(row.file_count),
      chunk_count: Number(row.chunk_count),
    }));

    return NextResponse.json({
      data: rows,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error("Error fetching knowledge list:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
