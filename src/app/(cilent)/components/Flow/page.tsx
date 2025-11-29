"use client";
import { ReactFlowProvider } from "@xyflow/react";
import FlowContent from "./components/FlowContent";
import type { Message } from "@/app/(cilent)/type";

export default function Flow({message}:{message?:Message[]}) {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlowProvider>
        <FlowContent message={message} />
      </ReactFlowProvider>
    </div>
  );
}
