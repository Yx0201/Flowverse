"use client";
import { ReactFlowProvider } from "@xyflow/react";
import ConversationProvider from "./components/ConversationProvider";
import SysInput from "../SysInput/page";
import { useConversationContext } from "./components/ConversationProvider";
import FlowContent from "./components/FlowContent";

// 内联SysInputWrapper组件
function SysInputWrapper() {
  const context = useConversationContext();

  return (
    <SysInput
      isStreaming={context.isStreaming}
      onSendMessage={context.sendMessageFlow}
      onStopStreaming={context.stopCurrentStreaming}
    />
  );
}

interface FlowProps {
  withInput?: boolean;
}

export default function Flow({ withInput = false }: FlowProps) {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlowProvider>
        <ConversationProvider>
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ flex: 1 }}>
              <FlowContent />
            </div>
            {withInput && (
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000
              }}>
                <SysInputWrapper />
              </div>
            )}
          </div>
        </ConversationProvider>
      </ReactFlowProvider>
    </div>
  );
}
