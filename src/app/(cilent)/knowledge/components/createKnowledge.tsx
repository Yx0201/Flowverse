"use client";

import { Form, Input, Modal } from "antd";
import { KnowledgeFormValues } from "../type";

interface ModalProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}



const CreateKnowledge: React.FC<ModalProps> = ({
  isModalOpen,
  setIsModalOpen,
}) => {
  const [knowledgeForm] = Form.useForm();

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const onFinish = (values: KnowledgeFormValues) => {
    console.log("Success:", values);
  };
  const handleOk = () => {
    knowledgeForm.submit();
    setIsModalOpen(false);
  };
  return (
    <Modal
      title="创建知识库"
      closable={{ "aria-label": "Custom Close Button" }}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
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
        <Form.Item label="知识库分类" name="category">
          <Input />
        </Form.Item>
        <Form.Item label="知识库描述" name="description">
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default CreateKnowledge;
