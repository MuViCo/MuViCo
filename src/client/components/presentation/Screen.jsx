import React, { useEffect, useRef } from "react";

const Screen = ({ screenNumber, screenData, isVisible }) => {
  const windowRef = useRef(null); // Keep a reference to the window object

  useEffect(() => {
    if (isVisible && !windowRef.current) {
      // Open a new window only if it isn't already opened
      const newWindow = window.open("", `Screen ${screenNumber}`, "width=800,height=600");
      windowRef.current = newWindow;

      // Initial content rendering
      newWindow.document.body.innerHTML = `
        <div>
          <h1>Screen ${screenNumber}</h1>
          <div id="screen-content"></div>
        </div>
      `;
    }

    // Handle closing the window when `isVisible` becomes false
    if (!isVisible && windowRef.current) {
      windowRef.current.close(); // Close the window
      windowRef.current = null; // Reset the window reference
    }

    return () => {
      // Ensure the window is closed when the component unmounts
      if (windowRef.current) {
        windowRef.current.close();
        windowRef.current = null;
      }
    };
  }, [isVisible, screenNumber]);

  // Update window content when `screenData` changes
  useEffect(() => {
    if (windowRef.current && screenData) {
      const contentDiv = windowRef.current.document.getElementById("screen-content");

      if (screenData?.file?.url) {
        // Display the media file (image in this case)
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

  return null; // No need to render anything in the main window
};

export default Screen;
