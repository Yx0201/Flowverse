"use client";
import styles from "./page.module.scss";
import Flow from "../components/Flow/page";
import SysInput from "../components/SysInput/page";
import { useState } from "react";

const Home = () => {
  const [message,setMessage]=useState<string>('');
  const handleSendMessage=async(message:string)=>{
    setMessage(message);
  }
  return (
    <div className={styles.homeRoot}>
      <div className={styles.conversation}>
        <Flow message={message} />
        <SysInput onSendMessage={handleSendMessage}  />
      </div>
    </div>
  );
};

export default Home;
