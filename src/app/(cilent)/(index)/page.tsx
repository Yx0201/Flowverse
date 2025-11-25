"use client";
import styles from "./page.module.scss";
import Flow from "../components/Flow/page";
import SysInput from "../components/SysInput/page";
import { useState, useEffect } from "react";
import type { addNodeProps } from "@/app/(cilent)/type";
import useLLmChat from "../hook/useLLMChat";

const Home = () => {
  const { currentStreamMessage, currentThinking, sendMessage } = useLLmChat();
  const [message, setMessage] = useState<addNodeProps>();
  // const [nodeId, setNodeId] = useState<string>("");

  const handleSendMessage = async (val: string) => {
    // setNodeId(crypto.randomUUID());
    sendMessage(val);
    setMessage({
      // id: `user-${nodeId}`,
      label: "User Node",
      content: {
        val: val,
      },
    });
  };

  useEffect(() => {
    if (currentStreamMessage || currentThinking) {
      console.log(currentStreamMessage, "currentStreamMessage");
      console.log(currentThinking, "currentThinking");
      setMessage({
        // id: `ai-${nodeId}`,
        label: "Ai Node",
        content: {
          think: currentThinking,
          val: currentStreamMessage,
        },
      });
    }
  }, [currentStreamMessage, currentThinking]);
  return (
    <div className={styles.homeRoot}>
      <div className={styles.conversation}>
        <Flow message={message} />
        <SysInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default Home;
