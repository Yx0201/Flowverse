"use client";
import { ReactFlowProvider } from "@xyflow/react";
import FlowContent from "./components/FlowContent";
import type { addNodeProps } from "@/app/(cilent)/type";

export default function Flow({message}:{message?:addNodeProps}) {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlowProvider>
        <FlowContent message={message} />
      </ReactFlowProvider>
    </div>
  );
}
