import React, { useEffect, useRef } from "react";

const Screen = ({ screenNumber, screenData, isVisible, onWindowClose }) => {
  const windowRef = useRef(null);

  useEffect(() => {
    if (isVisible && !windowRef.current) {
      const newWindow = window.open("", `Screen ${screenNumber}`, "width=800,height=600");
      windowRef.current = newWindow;

      newWindow.document.body.innerHTML = `
        <div>
          <h1>Screen ${screenNumber}</h1>
          <div id="screen-content"></div>
        </div>
      `;

      // Add listener to handle window close
      const handleWindowClose = () => {
        if (onWindowClose) {
          onWindowClose(screenNumber); // Inform parent that the window is closed
        }
      };

      newWindow.addEventListener("beforeunload", handleWindowClose);

      // Cleanup: remove the event listener on component unmount or window close
      return () => {
        if (windowRef.current) {
          windowRef.current.removeEventListener("beforeunload", handleWindowClose);
          windowRef.current.close();
          windowRef.current = null;
        }
      };
    }
  }, [isVisible, screenNumber, onWindowClose]);

  // Update window content when `screenData` changes
  useEffect(() => {
    if (windowRef.current && screenData) {
      const contentDiv = windowRef.current.document.getElementById("screen-content");

      if (screenData?.file?.url) {
        contentDiv.innerHTML = `
          <p><strong>Cue Name:</strong> ${screenData.name}</p>
          <img src="${screenData.file.url}" style="max-width: 100%;" alt="${screenData.name}" />
        `;
      } else {
        contentDiv.innerHTML = `
          <p>No media available for this cue.</p>
        `;
      }
    }
  }, [screenData]);

  return null;
};

export default Screen;
