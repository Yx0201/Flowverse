"use client";
import styles from "./page.module.scss";
import Flow from "../components/Flow/page";

const Home = () => {
  return (
    <div className={styles.homeRoot}>
      <div className={styles.conversation}>
        <Flow withInput={true} />
      </div>
    </div>
  );
};

export default Home;