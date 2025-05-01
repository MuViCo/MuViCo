# #389: Review architecture documentation for outdated or missing information

## Up to date files

`documentation/architecture/cloud-deployment.md`
  - Cloud deployment overview, was just added and is up to date.

## Outdated / missing information files

`documentation/architecture/overview.md`
- Contains only the text: "_todo: summary of architecture files_".
- Was meant to be some sort of architecture overview,  but the exact vision is left unclear. Necessity is debatable if the team doesn't know what to do with the file.
- **Suggestion**: Could be deleted.

`documentation/architecture/sprint 1.png`
- Client and server architecture diagrams. Outdated and redundant with `sprint 2.png` being a newer version. 
- **Suggestion**: Could be deleted.

`documentation/architecture/sprint 2.png`
  - Client and server architecture diagrams. Outdated, some files in the diagrams no longer exist and some are missing. Further details in the next section.
  - **Suggestion**: If time permits, create updated diagrams to match the current architecture, and change file name to something more suitable.
    - This is a larger task that involves creating new client and server diagrams with the correct folders, files, and accurate component interaction arrows.
    - If updated diagrams aren't created, this file should at the very least be marked as outdated.

## Analysis of `sprint 2.png` architecture diagrams

`src/client/`
- Missing folders:
  - src/client/public/
  - src/client/redux/
- Missing files:
  - src/client/auth.js
- Other:
  - src/client/main.jsx is depicted as being located outside the client folder, this is inaccurate.

`src/client/components/`
- Missing folders:
  - src/client/components/admin/
  - src/client/components/data/
  - src/client/components/footer/
  - src/client/components/termspage/
  - src/client/components/utils/
  
`src/client/lib/`
- Missing files:
  - src/client/lib/fonts.jsx
  - src/client/lib/icons.jsx

`src/client/services/`
- Missing files:
  - src/client/services/admin.js
  - src/client/services/presentation.js
  - src/client/services/users.js

`src/client/components/frontpage/`
- Missing files:
  - src/client/components/frontpage/Card.jsx
  - src/client/components/frontpage/ModalSvgs.jsx
  - src/client/components/frontpage/RadialCircle.jsx
- Files that no longer exist:
  - src/client/components/frontpage/Body.jsx
  
`src/client/components/homepage/`
- Missing files:
  - src/client/components/homepage/AdminControls.jsx
  - src/client/components/homepage/HomepageManual.jsx
  - src/client/components/homepage/PresentationForm.jsx
  - src/client/components/homepage/PresentationFormWrapper.jsx
  - src/client/components/homepage/PresentationsGrid.jsx
  - src/client/components/homepage/LinkGoogleDriveButton.jsx
  - src/client/components/homepage/StorageInfoModal.jsx
- Files that no longer exist:
  - src/client/components/homepage/Body.jsx
  - src/client/components/homepage/Togglable.jsx

`src/client/components/navbar/`
- Missing files:
  - src/client/components/navbar/UserManualModal.jsx
- Files that no longer exist:
  - src/client/components/navbar/Error.jsx

`src/client/components/presentation/`
- Missing files:
  - src/client/components/presentation/CuesForm.jsx
  - src/client/components/presentation/EditMode.jsx
  - src/client/components/presentation/GoogleSignInButton.jsx
  - src/client/components/presentation/GridLayoutComponent.jsx
  - src/client/components/presentation/PresentationManual.jsx
  - src/client/components/presentation/Screen.jsx
  - src/client/components/presentation/ShowMode.jsx
  - src/client/components/presentation/ShowModeButtons.jsx
  - src/client/components/presentation/StatusToolTip.jsx
  - src/client/components/presentation/ToolBox.jsx
  - src/client/components/presentation/SignInInfoModal.jsx
- Files that no longer exist:
  - src/client/components/presentation/image.jsx
  - src/client/components/presentation/pdfviewer.jsx
  - src/client/components/presentation/presentationform

`src/server/`
- Missing folders:
  - src/server/public/

`src/server/routes/`
- Missing files:
  - src/server/routes/admin.js
  - src/server/routes/presentation.js
  - src/server/routes/terms.js
  - src/server/routes/driveProxy.js
  - src/server/routes/users.js

`src/server/utils/`
- Missing files:
  - src/server/utils/helper.js
  - src/server/utils/s3.js
  - src/server/utils/verifyToken.js
  - src/server/utils/drive.js
