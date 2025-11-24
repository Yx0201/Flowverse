"use client";

import { ReactFlow, MiniMap, Node, Controls,useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useState,useEffect } from "react";
import CustomNode from "./CustomNode";

const defaultNodes = [
  {
    id: "1",
    data: { label: "欢迎提问" },
    position: { x: 250, y: 250 },
  },
];

const defaultEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3", animated: true },
];

const nodeColor = (node: Node): string => {
  const color = node.data?.color;
  return typeof color === "string" ? color : "#eee";
};

const nodeTypes = {
  custom: CustomNode,
};

const fitViewOptions = {
  minZoom: 0.5,
  maxZoom: 0.9,
  duration: 800,
};


const Flow = ({message}:{message?:string}) => {
  // const [nodes, setNodes] = useState();
  // const [edges, setEdges] = useState();
  const {setNodes,setEdges}=useReactFlow();

  useEffect(() => {
    if(message?.trim()){
      const newNode = {
        id: (defaultNodes.length + 1).toString(),
        data: { label: message },
        type: "custom",
        position: { x: Math.random() * 400, y: Math.random() * 400 },
      };
      const newEdge = {
        id: `e${defaultNodes.length}-${defaultNodes.length + 1}`,
        source: "1",
        target: newNode.id,
      };
      setNodes((nds) => [...nds, newNode]);
      // Optionally, you can also add edges here if needed
      setEdges((eds) => [...eds, newEdge]);
    }
  }, [message,setNodes,setEdges]);

  return (
    <ReactFlow
      defaultNodes={defaultNodes}
      defaultEdges={[]}
      fitView
      fitViewOptions={fitViewOptions}
      nodeTypes={nodeTypes}
    >
      <MiniMap nodeColor={nodeColor} zoomable pannable />
      <Controls fitViewOptions={fitViewOptions} />
    </ReactFlow>
  );
};

export default Flow;
