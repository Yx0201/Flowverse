"use client";

import { Button, Card, Input, Pagination, Spin, message } from "antd";
import { Search, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import CreateKnowledge from "./components/createKnowledge";
import { KnowledgeItem } from "./type";

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Knowledge = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  // 获取知识库列表
  const fetchKnowledgeList = async (search?: string, page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (search && search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetch(`/rag?${params}`);
      if (!response.ok) {
        throw new Error("获取知识库列表失败");
      }
      const result = await response.json();
      setKnowledgeList(result.data);
      setTotal(result.pagination.total);
    } catch (error) {
      console.error("获取知识库列表时出错:", error);
      message.error("获取知识库列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 防抖搜索
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (keyword: string, page: number = 1) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setCurrentPage(page);
          fetchKnowledgeList(keyword, page);
        }, 500); // 500ms 防抖延迟
      };
    })(),
    []
  );

  // 搜索知识库
  const queryKnowledge = () => {
    debouncedSearch(searchKeyword, 1);
  };

  // 处理输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchKeyword(value);
    debouncedSearch(value, 1);
  };

  // 清空搜索
  const clearSearch = async () => {
    setSearchKeyword("");
    setCurrentPage(1);
    await fetchKnowledgeList("", 1);
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchKnowledgeList();
  }, []);

  // 当分页变化时重新获取数据
  useEffect(() => {
    fetchKnowledgeList(searchKeyword, currentPage);
  }, [currentPage]);

  // 当模态框关闭后刷新数据
  useEffect(() => {
    if (!isModalOpen) {
      setCurrentPage(1); // 重置到第一页
      fetchKnowledgeList(searchKeyword, 1);
    }
  }, [isModalOpen]);
  return (
    <div className="h-screen">
      <div className="w-1/2 h-[10vh] flex items-center gap-4 ps-4">
        <Input
          placeholder="搜索知识库..."
          value={searchKeyword}
          onChange={handleSearchChange}
          suffix={
            <div className="flex items-center gap-1">
              {searchKeyword && (
                <X
                  className="text-gray-400 cursor-pointer hover:text-gray-600 transition-all"
                  onClick={clearSearch}
                />
              )}
              <Search
                className="text-blue-500 cursor-pointer hover:text-blue-700 transition-all"
                onClick={queryKnowledge}
              />
            </div>
          }
        />
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          新建
        </Button>
      </div>

      <div className="h-[84vh] p-4 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spin size="large"  />
          </div>
        ) : knowledgeList.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full">
            <div className="text-gray-500 text-lg mb-4">暂无知识库数据</div>
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
              创建第一个知识库
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {knowledgeList.map((item) => (
              <Card
                key={item.id}
                title={item.name}
                className="h-fit shadow-sm hover:shadow-md transition-shadow"
                hoverable
                extra={
                  <span className="text-xs text-gray-500">{item.type_name}</span>
                }
              >
                <div className="space-y-2">
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {item.description || "暂无描述"}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>文件: {item.file_count}</span>
                    <span>切片: {item.chunk_count}</span>
                  </div>
                  <div className="text-xs text-gray-400 pt-2 border-t">
                    创建时间: {formatDateTime(item.created_at)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {knowledgeList.length > 0 && (
        <div className="w-full h-[6vh] flex justify-end items-center pe-4 border-t">
          <Pagination
            current={currentPage}
            total={total}
            pageSize={pageSize}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }
          />
        </div>
      )}

      <CreateKnowledge
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
    </div>
  );
};

export default Knowledge;
