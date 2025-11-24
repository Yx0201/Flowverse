"use client";
import { ReactFlowProvider } from "@xyflow/react";
import FlowContent from "./components/FlowContent";

export default function Flow({message}:{message?:string}) {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlowProvider>
        <FlowContent message={message} />
      </ReactFlowProvider>
    </div>
  );
}
