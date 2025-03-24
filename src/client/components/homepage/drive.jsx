// // App.jsx
// import React from "react";
// import { initializeApp } from "firebase/app";
// import {
//   getAuth,
//   signInWithPopup,
//   GoogleAuthProvider,
//   linkWithPopup,
// } from "firebase/auth";

// // Your Firebase configuration (replace with your own)
// const firebase = {
//   apiKey: "AIzaSyBp3YmS2kptNpV5G1xuE6UzYdxrRUAWyZQ",
//   projectId: "muvico-cloud-project"
// };

// // Initialize Firebase
// initializeApp(firebase);
// const auth = getAuth();


// export function LinkGoogleDrive() {
//   const handleLinkDrive = async () => {
//     // Create a new provider for Drive linking with additional scopes
//     const driveProvider = new GoogleAuthProvider();
//     // Add the additional scope for Google Drive access
//     driveProvider.addScope("https://www.googleapis.com/auth/drive.file");

//     try {
//       // Link the additional credentials to the current user
//       const result = await linkWithPopup(auth.currentUser, driveProvider);
//       console.log("Google Drive linked successfully!", result);
//       // The resulting credential will include a Drive access token
//     } catch (error) {
//       console.error("Error linking Google Drive:", error);
//     }
//   };

//   return (
//     <div>
//       {/* Only show this button if the user is signed in */}
//       {auth.currentUser ? (
//         <button onClick={handleLinkDrive}>Link Google Drive</button>
//       ) : (
//         <p>Please sign in first.</p>
//       )}
//     </div>
//   );
// }