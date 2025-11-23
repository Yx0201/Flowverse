// 颜色选项
const colorOptions = [
  '#f5f5f5', // 默认灰色
  '#e3f2fd', // 浅蓝色
  '#f3e5f5', // 浅紫色
  '#fff3e0', // 浅橙色
  '#e8f5e8', // 浅绿色
  '#fce4ec', // 浅粉色
  '#f3e4f1', // 浅紫罗兰色
  '#fff9c4', // 浅黄色
  '#e0f2f1', // 浅青色
  '#ffffff', // 白色
  '#ffebee', // 浅红色
  '#e1f5fe', // 淡蓝色
];

interface ColorToolProps {
  nodeId: string;
  currentColor: string;
  onColorChange: (nodeId: string, color: string) => void;
}

export function ColorTool({ nodeId, currentColor, onColorChange }: ColorToolProps) {
  const handleColorChange = (color: string) => {
    onColorChange(nodeId, color);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        padding: '8px',
        borderRadius: '8px',
        backgroundColor: 'white',
        border: '1px solid #e5e5e5',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
      className="color-tool"
    >
      {colorOptions.map((colorOption) => (
        <button
          key={colorOption}
          onClick={() => handleColorChange(colorOption)}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            border: currentColor === colorOption ? '2px solid #1890ff' : '1px solid #d0d0d0',
            cursor: 'pointer',
            transition: 'transform 0.15s ease-in-out',
            backgroundColor: colorOption,
          }}
          title={`设置节点颜色为 ${colorOption}`}
          className="color-option"
        />
      ))}
    </div>
  );
}