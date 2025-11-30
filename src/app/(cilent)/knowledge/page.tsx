"use client";

import { Button, Card, Input, Pagination } from "antd";
import { Search } from "lucide-react";
import { useState } from "react";
import CreateKnowledge from "./components/createKnowledge";
import { KnowledgeItem } from "./type";

const testList: KnowledgeItem[] = [
  {
    id: 1,
    name: "知识库1",
    description: "这是知识库1的描述",
    category: 1,
    fileNum: 34,
  },
  {
    id: 2,
    name: "知识库2",
    description: "这是知识库1的描述",
    category: 2,
    fileNum: 12,
  },
  {
    id: 3,
    name: "知识库3",
    description: "这是知识库1的描述",
    category: 3,
    fileNum: 66,
  },
  {
    id: 4,
    name: "知识库4",
    description: "这是知识库1的描述",
    category: 4,
    fileNum: 56,
  },
  {
    id: 5,
    name: "知识库5",
    description: "这是知识库5的描述",
    category: 4,
    fileNum: 34,
  },
  {
    id: 6,
    name: "知识库5",
    description: "这是知识库5的描述",
    category: 4,
    fileNum: 34,
  },
  {
    id: 7,
    name: "知识库5",
    description: "这是知识库5的描述",
    category: 4,
    fileNum: 34,
  },
  {
    id: 8,
    name: "知识库5",
    description: "这是知识库5的描述",
    category: 4,
    fileNum: 34,
  },
  {
    id: 9,
    name: "知识库5",
    description: "这是知识库5的描述",
    category: 4,
    fileNum: 34,
  },
  
  
  
];

const Knowledge = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryKnowledge = () => {
    console.log("查询");
    console.log(testList, "testList");
  };
  return (
    <div className=" h-screen ">
      <div className="w-1/2 h-[10vh]  flex items-center gap-4 ps-4">
        <Input
          suffix={
            <Search
              className="text-amber-200 cursor-pointer hover:text-amber-700 transition-all"
              onClick={queryKnowledge}
            />
          }
        />
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          新建
        </Button>
      </div>
      <div className="h-[84vh] p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 place-content-start overflow-y-auto">
        {testList.map((item) => (
          <Card key={item.id} title={item.name} className="h-fit" hoverable>
            <p>{item.description}</p>
            <div>文件数量: {item.fileNum}</div>
          </Card>
        ))}
      </div>
      <div className="w-full h-[6vh] flex justify-end items-center pe-4">
        <Pagination defaultCurrent={1} total={50} />
      </div>
      <CreateKnowledge
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
    </div>
  );
};

export default Knowledge;
