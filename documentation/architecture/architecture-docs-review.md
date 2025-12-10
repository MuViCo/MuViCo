# #389: Review architecture documentation for outdated or missing information

## 1. Up to date files

`documentation/architecture/cloud-deployment.md`

- Cloud deployment overview, was just added and is up to date at the time of writing.

`documentation/architecture/backend-module-dependencies.png` and `documentation/architecture/frontend-module-dependencies.png`

- Detailed module dependency charts for the front- and backend. The charts were produced using [Madge](https://github.com/pahen/madge), which is highly recommended for future use too! More detail in [Section 3](#3-listing-module-dependencies-using-madge).

## 2. Archived documentation with outdated / missing information

**All of these files can potentially be deleted if they are not needed.**

`documentation/archive/architecture/overview.md`

- Contains only the text: "_todo: summary of architecture files_".
- Was meant to be some sort of architecture overview,  but the exact vision is left unclear.

`documentation/archive/architecture/sprint 1.png`

- Client and server architecture diagrams. Outdated and redundant with `sprint 2.png` being a newer version.

`documentation/archive/architecture/sprint 2.png`

- Client and server architecture diagrams. Outdated, some modules in the diagrams no longer exist and new ones are missing.

## 3. Listing module dependencies using Madge

Tools like [Madge](https://github.com/pahen/madge) are a quick and easy way to figure out up-to-date module dependencies. Compared to manually going through files one by one – a project that is both challenging to do without errors and very boring – Madge can be used to list all dependencies for modules in a given folder in mere seconds. This output can be a text listing or a visual graph.

### Module dependencies as of 8.12.2025

Note that we are excluding test files in these outputs. Review the documentation in the Madge repository readme file for installation and usage instructions.

#### Visual graphs

- Frontend: [frontend-module-dependencies.png](frontend-module-dependencies.png)
- Backend: [backend-module-dependencies.png](backend-module-dependencies.png)

#### Text outputs

##### Frontend

```Nushell
~/MuViCo$ npx madge --extensions js,jsx --exclude 'test' src/client
Processed 77 files (2.1s) (1 warning)

App.jsx
  components/admin/UserMedia.jsx
  components/admin/UserPresentations.jsx
  components/admin/UsersList.jsx
  components/footer/index.jsx
  components/frontpage/index.jsx
  components/homepage/index.jsx
  components/navbar/index.jsx
  components/presentation/index.jsx
  components/termspage/index.jsx
  lib/fonts.jsx
  lib/theme.jsx
auth.js
components/admin/UserMedia.jsx
components/admin/UserPresentations.jsx
  components/utils/randomGradient.js
  services/admin.js
components/admin/UsersList.jsx
  components/utils/randomGradient.js
  services/admin.js
components/data/frontpageData.js
components/data/homepageData.js
components/data/presentationPageData.js
components/data/tutorialSteps.js
components/footer/index.jsx
components/frontpage/Card.jsx
components/frontpage/FrontpageManual.jsx
  components/data/frontpageData.js
  components/utils/FeatureSection.jsx
components/frontpage/ModalSvgs.jsx
components/frontpage/RadialCircle.jsx
components/frontpage/index.jsx
  components/frontpage/Card.jsx
  components/frontpage/ModalSvgs.jsx
  components/frontpage/RadialCircle.jsx
  public/editmodepreview.png
  public/muvico_intro_editmode.mp4
  public/muvico_showmode.mp4
  public/showmodepreview.png
components/homepage/AdminControls.jsx
components/homepage/HomepageManual.jsx
  components/data/homepageData.js
  components/utils/FeatureSection.jsx
components/homepage/LinkGoogleDriveButton.jsx
  components/utils/firebase.js
  components/utils/toastUtils.js
  services/users.js
components/homepage/PresentationForm.jsx
components/homepage/PresentationFormWrapper.jsx
  components/homepage/PresentationForm.jsx
  components/utils/Togglable.jsx
components/homepage/PresentationsGrid.jsx
  components/utils/randomGradient.js
components/homepage/StorageInfoModal.jsx
components/homepage/index.jsx
  components/data/tutorialSteps.js
  components/homepage/AdminControls.jsx
  components/homepage/LinkGoogleDriveButton.jsx
  components/homepage/PresentationFormWrapper.jsx
  components/homepage/PresentationsGrid.jsx
  components/homepage/StorageInfoModal.jsx
  components/tutorial/TutorialGuide.jsx
  components/utils/AlertDialog.jsx
  components/utils/addInitialElements.js
  components/utils/toastUtils.js
  components/utils/useDeletePresentation.js
  services/presentations.js
  services/users.js
components/navbar/Login.jsx
  components/presentation/GoogleSignInButton.jsx
  components/utils/Error.jsx
  services/login.js
components/navbar/SignUp.jsx
  components/utils/Error.jsx
  services/login.js
  services/signup.js
components/navbar/UserManualModal.jsx
  components/frontpage/FrontpageManual.jsx
  components/homepage/HomepageManual.jsx
  components/presentation/PresentationManual.jsx
components/navbar/index.jsx
  auth.js
  components/navbar/Login.jsx
  components/navbar/SignUp.jsx
  components/navbar/UserManualModal.jsx
  components/navbar/theme-toggle-button.jsx
components/navbar/theme-toggle-button.jsx
components/presentation/CuesForm.jsx
  components/utils/Error.jsx
  components/utils/numberInputUtils.js
components/presentation/EditMode.jsx
  components/presentation/GridLayoutComponent.jsx
  components/presentation/StatusToolTip.jsx
  components/presentation/ToolBox.jsx
  components/utils/AlertDialog.jsx
  components/utils/CustomAlert.jsx
  components/utils/formDataUtils.js
  components/utils/toastUtils.js
  lib/icons.jsx
  redux/presentationReducer.js
  redux/presentationThunks.js
  services/presentation.js
components/presentation/GoogleSignInButton.jsx
  components/presentation/SignInInfoModal.jsx
  components/utils/firebase.js
components/presentation/GridLayoutComponent.jsx
  components/utils/AlertDialog.jsx
  components/utils/toastUtils.js
  redux/presentationReducer.js
components/presentation/PresentationManual.jsx
  components/data/presentationPageData.js
  components/utils/FeatureSection.jsx
components/presentation/PresentationTitle.jsx
  components/utils/toastUtils.js
  redux/presentationReducer.js
components/presentation/Screen.jsx
  components/utils/fileTypeUtils.js
  utils/transitionUtils.js
components/presentation/ShowMode.jsx
  components/presentation/Screen.jsx
  components/presentation/ShowModeButtons.jsx
  components/utils/keyboardHandler.jsx
components/presentation/ShowModeButtons.jsx
components/presentation/SignInInfoModal.jsx
components/presentation/StatusToolTip.jsx
components/presentation/ToolBox.jsx
  components/presentation/CuesForm.jsx
components/presentation/index.jsx
  components/data/tutorialSteps.js
  components/presentation/EditMode.jsx
  components/presentation/PresentationTitle.jsx
  components/presentation/ShowMode.jsx
  components/tutorial/TutorialGuide.jsx
  components/utils/AlertDialog.jsx
  components/utils/useDeletePresentation.js
  redux/presentationReducer.js
components/termspage/index.jsx
components/tutorial/TutorialGuide.jsx
components/utils/AlertDialog.jsx
components/utils/CustomAlert.jsx
components/utils/Error.jsx
components/utils/FeatureSection.jsx
  components/utils/NestedList.jsx
components/utils/NestedList.jsx
components/utils/Togglable.jsx
components/utils/addInitialElements.js
  components/utils/formDataUtils.js
  services/presentation.js
components/utils/config.js
components/utils/fileTypeUtils.js
components/utils/firebase.js
  components/utils/config.js
components/utils/formDataUtils.js
components/utils/keyboardHandler.jsx
components/utils/numberInputUtils.js
components/utils/randomGradient.js
components/utils/toastUtils.js
components/utils/useDeletePresentation.js
  components/utils/toastUtils.js
  redux/presentationReducer.js
lib/fonts.jsx
lib/icons.jsx
lib/theme.jsx
main.jsx
  App.jsx
  redux/store.js
public/editmodepreview.png
public/muvico_intro_editmode.mp4
public/muvico_showmode.mp4
public/showmodepreview.png
redux/presentationReducer.js
  components/utils/formDataUtils.js
  redux/presentationThunks.js
  services/presentation.js
redux/presentationThunks.js
  services/presentation.js
redux/store.js
  redux/presentationReducer.js
services/admin.js
  auth.js
services/login.js
services/presentation.js
  auth.js
services/presentations.js
  auth.js
services/signup.js
services/users.js
  auth.js
utils/transitionUtils.js
```

##### Backend

```Nushell
~/MuViCo$ npx madge --extensions js,jsx --exclude 'test' src/server
Processed 19 files (685ms) 

app.js
  routes/admin.js
  routes/driveProxy.js
  routes/login.js
  routes/presentation.js
  routes/presentations.js
  routes/signup.js
  routes/terms.js
  routes/users.js
  utils/config.js
  utils/logger.js
  utils/middleware.js
index.js
  app.js
  utils/config.js
  utils/logger.js
models/presentation.js
models/user.js
routes/admin.js
  models/presentation.js
  models/user.js
  utils/middleware.js
routes/driveProxy.js
  utils/drive.js
routes/login.js
  models/user.js
  utils/config.js
  utils/verifyToken.js
routes/presentation.js
  models/presentation.js
  utils/config.js
  utils/drive.js
  utils/helper.js
  utils/logger.js
  utils/middleware.js
  utils/s3.js
routes/presentations.js
  models/presentation.js
  utils/middleware.js
routes/signup.js
  models/user.js
routes/terms.js
routes/users.js
  utils/middleware.js
utils/config.js
utils/drive.js
utils/helper.js
  utils/drive.js
  utils/s3.js
utils/logger.js
utils/middleware.js
  models/user.js
  utils/logger.js
utils/s3.js
  utils/config.js
utils/verifyToken.js
  utils/config.js
```
