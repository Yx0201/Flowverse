"use client";

import { useRef, useCallback } from "react";

const useContentHeight = () => {
  const hiddenDivRef = useRef<HTMLDivElement>(null);

  const measureContentHeight = useCallback(
    (textarea: HTMLTextAreaElement): number => {
      if (!hiddenDivRef.current) {
        hiddenDivRef.current = document.createElement("div");
        hiddenDivRef.current.style.position = "absolute";
        hiddenDivRef.current.style.top = "0px";
        hiddenDivRef.current.style.left = "0px";
        hiddenDivRef.current.style.visibility = "hidden";
        hiddenDivRef.current.style.pointerEvents = "none";
        document.body.appendChild(hiddenDivRef.current);
      }

      const hiddenDiv = hiddenDivRef.current;
      const computedStyle = window.getComputedStyle(textarea);

      Object.assign(hiddenDiv.style, {
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
        width: computedStyle.width,
        padding: computedStyle.padding,
        margin: computedStyle.margin,
        border: computedStyle.border,
        fontSize: computedStyle.fontSize,
        fontFamily: computedStyle.fontFamily,
        lineHeight: computedStyle.lineHeight,
        fontWeight: computedStyle.fontWeight,
        boxSizing: computedStyle.boxSizing,
      });

      hiddenDiv.textContent = textarea.value || " ";

      return hiddenDiv.scrollHeight;
    },
    []
  );

  return { measureContentHeight };
};

export default useContentHeight;
