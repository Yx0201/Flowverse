"use client";
import { ReactFlowProvider } from "@xyflow/react";
import FlowContent from "./components/FlowContent";

export default function Flow() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlowProvider>
        <FlowContent />
      </ReactFlowProvider>
    </div>
  );
}
