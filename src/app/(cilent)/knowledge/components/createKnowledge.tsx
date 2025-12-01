"use client";

import { Button, Form, Input, Modal, Select, Upload, UploadFile, UploadProps, message } from "antd";
import { KnowledgeFormValues } from "../type";
import { useEffect, useState } from "react";

interface ModalProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateKnowledge: React.FC<ModalProps> = ({
  isModalOpen,
  setIsModalOpen,
}) => {
  const [knowledgeForm] = Form.useForm();
  const [typeList, setTypeList] = useState<
    Array<{ id: number; name: string; code: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const onFinish = async (values: KnowledgeFormValues) => {
    setLoading(true);
    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('name', values.name);
      if (values.description) {
        formData.append('description', values.description);
      }
      if (values.type) {
        formData.append('type', values.type.toString());
      }

      // 添加文件到FormData
      const validFiles = values.fileList.filter((file: UploadFile) => file.originFileObj);
      if (validFiles.length === 0) {
        throw new Error('请选择有效的文件');
      }

      validFiles.forEach((file: UploadFile) => {
        if (file.originFileObj) {
          formData.append('files', file.originFileObj);
        }
      });

      // 发送请求到API
      const response = await fetch('/api/rag', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '创建知识库失败');
      }

      const result = await response.json();
      console.log('知识库创建成功:', result);

      // 成功后关闭modal并刷新页面或通知父组件
      setIsModalOpen(false);

      // 显示成功提示
      message.success('知识库创建成功！');

      // 可以触发页面刷新或更新知识库列表
      window.location.reload();

    } catch (error) {
      console.error('创建知识库时出错:', error);
      message.error(error instanceof Error ? error.message : '创建知识库失败');
    } finally {
      setLoading(false);
    }
  };
  const handleOk = () => {
    knowledgeForm.submit();
  };

  useEffect(() => {
    if (isModalOpen) {
      knowledgeForm.resetFields();
      fetch("/types")
        .then((res) => res.json())
        .then((data) => {
          setTypeList(data);
        })
        .catch((error) => {
          console.error("Error fetching knowledge types:", error);
        });
    }
  }, [isModalOpen, knowledgeForm]);

  const props: UploadProps = {
    beforeUpload: (file) => {
      // 只允许文本文件
      const isTextFile = file.type === 'text/plain' ||
                       file.type === 'text/markdown' ||
                       file.type === 'text/html' ||
                       file.type === 'application/json' ||
                       file.name.endsWith('.txt') ||
                       file.name.endsWith('.md') ||
                       file.name.endsWith('.json');

      if (!isTextFile) {
        message.error('只支持文本文件格式 (.txt, .md, .json)');
        return false;
      }

      // 限制文件大小 (10MB)
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过10MB');
        return false;
      }

      return false; // 阻止自动上传
    },
    accept: '.txt,.md,.json,text/plain,text/markdown,application/json',
  };

  return (
    <Modal
      title="创建知识库"
      closable={{ "aria-label": "Custom Close Button" }}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okButtonProps={{ disabled: loading }}
      cancelButtonProps={{ disabled: loading }}
    >
      {/* 下面是一个表单,需要用户输入知识库名称,知识库描述,知识库分类,知识库是公开的信息 */}
      <Form layout="vertical" onFinish={onFinish} form={knowledgeForm}>
        <Form.Item
          label="知识库名称"
          name="name"
          rules={[{ required: true, message: "请输入知识库名称!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="知识库分类"
          name="type"
          rules={[{ required: true, message: "请输入知识库分类!" }]}
        >
          <Select
            options={typeList.map((type) => ({
              label: type.name,
              value: type.id,
            }))}
          />
        </Form.Item>
        <Form.Item label="知识库描述" name="description">
          <Input.TextArea />
        </Form.Item>

        <Form.Item
          label="选择文件"
          valuePropName="fileList"
          name="fileList"
          getValueFromEvent={(e) => {
            if (Array.isArray(e)) {
              return e;
            }
            return e?.fileList;
          }}
          rules={[{ required: true, message: "请至少上传一个文件!" }]}
        >
          <Upload {...props} maxCount={5}>
            <Button icon={<Upload />}>Select File</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default CreateKnowledge;
