# #389: Review architecture documentation for outdated or missing information

> Originally written 8.12.2025. Refreshed 2.9.2026 — the frontend has since migrated large parts of the codebase to TypeScript and gained an entire timeline-based editor rewrite, the Scores/PDF-marker feature, and multi-screen image spanning, none of which existed in the original module dependency snapshot below. The dependency listings were regenerated; see [Section 3](#3-listing-module-dependencies-using-madge).

## 1. Up to date files

`documentation/architecture/cloud-deployment.md`

- Cloud deployment overview. Updated 2.9.2026 to describe the current GitOps/Argo CD-driven deployment (a separate `gitops` repository, Argo CD Image Updater watching for release tags) — the previous version described a manual `kubectl apply -f manifests/` process that stopped being how deployments actually happen once GitOps was introduced.

## 2. Needs attention

`documentation/architecture/backend-module-dependencies.png` and `documentation/architecture/frontend-module-dependencies.png`

- These visual graphs are still the ones generated in December 2025 and are now stale — compare against the regenerated text listings in [Section 3](#3-listing-module-dependencies-using-madge), which show materially more modules on both sides. Regenerating them needs [Graphviz](https://graphviz.org/) (`dot`) installed locally; `npx madge --image <path>.png ...` will not produce output without it. Not redone here for lack of that dependency in this environment — worth doing next time someone has Graphviz available.

## 2b. Archived documentation with outdated / missing information

**All of these files can potentially be deleted if they are not needed.**

`documentation/archive/architecture/overview.md`

- Contains only the text: "_todo: summary of architecture files_".
- Was meant to be some sort of architecture overview, but the exact vision is left unclear.

`documentation/archive/architecture/sprint 1.png`

- Client and server architecture diagrams. Outdated and redundant with `sprint 2.png` being a newer version.

`documentation/archive/architecture/sprint 2.png`

- Client and server architecture diagrams. Outdated, some modules in the diagrams no longer exist and new ones are missing.

## 3. Listing module dependencies using Madge

Tools like [Madge](https://github.com/pahen/madge) are a quick and easy way to figure out up-to-date module dependencies. Compared to manually going through files one by one – a project that is both challenging to do without errors and very boring – Madge can be used to list all dependencies for modules in a given folder in mere seconds. This output can be a text listing or a visual graph.

### Module dependencies as of 2.9.2026

Note that we are excluding test files in these outputs, and now including `.ts`/`.tsx` alongside `.js`/`.jsx` since much of the frontend has migrated to TypeScript. Review the documentation in the Madge repository readme file for installation and usage instructions.

#### Visual graphs

- Frontend: [frontend-module-dependencies.png](frontend-module-dependencies.png) (stale — see [Section 2](#2-needs-attention))
- Backend: [backend-module-dependencies.png](backend-module-dependencies.png) (stale — see [Section 2](#2-needs-attention))

#### Text outputs

##### Frontend

```
~/MuViCo$ npx madge --extensions js,jsx,ts,tsx --exclude 'test' src/client
Processed 111 files (1.9s) (54 warnings)

../../styles.css
../constants.d.ts
../constants.js
App.tsx
  components/admin/UserPresentations.tsx
  components/admin/UsersList.tsx
  components/footer/index.tsx
  components/frontpage/index.tsx
  components/homepage/index.tsx
  components/navbar/index.tsx
  components/presentation/index.jsx
  components/privacypage/index.tsx
  components/profilepage/profile.tsx
  components/termspage/index.tsx
  lib/fonts.tsx
  lib/theme.tsx
  services/auth.ts
  types/index.ts
auth.ts
  types/index.ts
components/admin/UserPresentations.tsx
  components/utils/randomGradient.ts
  services/admin.ts
  types/index.ts
components/admin/UsersList.tsx
  components/utils/randomGradient.ts
  services/admin.ts
  types/index.ts
components/data/frontpageData.ts
  types/index.ts
components/data/homepageData.ts
  types/index.ts
components/data/presentationPageData.ts
  types/index.ts
components/data/tutorialSteps.ts
  types/index.ts
components/footer/index.tsx
components/frontpage/Card.tsx
components/frontpage/FrontpageManual.tsx
  components/data/frontpageData.ts
  components/utils/FeatureSection.tsx
components/frontpage/ModalSvgs.tsx
components/frontpage/RadialCircle.tsx
components/frontpage/index.tsx
  components/frontpage/Card.tsx
  components/frontpage/ModalSvgs.tsx
  components/frontpage/RadialCircle.tsx
  public/MuViCoIntro.mp4
  public/b_hy_logo.svg
  public/hy_logo.svg
  public/introvideopreview-dark.png
  public/introvideopreview-light.png
components/homepage/AdminControls.tsx
components/homepage/HomepageManual.tsx
  components/data/homepageData.ts
  components/utils/FeatureSection.tsx
components/homepage/LinkGoogleDriveButton.tsx
  components/utils/firebase.ts
  components/utils/toastUtils.ts
  services/users.ts
  types/index.ts
components/homepage/PresentationForm.tsx
  types/index.ts
components/homepage/PresentationFormWrapper.tsx
  components/homepage/PresentationForm.tsx
  components/utils/Togglable.tsx
  types/index.ts
components/homepage/PresentationsGrid.tsx
  types/index.ts
components/homepage/StorageInfoModal.tsx
  types/index.ts
components/homepage/index.tsx
  components/data/tutorialSteps.ts
  components/homepage/AdminControls.tsx
  components/homepage/LinkGoogleDriveButton.tsx
  components/homepage/PresentationFormWrapper.tsx
  components/homepage/PresentationsGrid.tsx
  components/homepage/StorageInfoModal.tsx
  components/tutorial/TutorialGuide.tsx
  components/utils/AlertDialog.tsx
  components/utils/Togglable.tsx
  components/utils/toastUtils.ts
  components/utils/useDeletePresentation.ts
  services/presentations.ts
  services/users.ts
  types/index.ts
components/navbar/Login.tsx
  components/presentation/GoogleSignInButton.jsx
  components/utils/Error.tsx
  services/auth.ts
  types/index.ts
components/navbar/SignUp.tsx
  ../constants.d.ts
  components/utils/Error.tsx
  services/auth.ts
  types/index.ts
components/navbar/UserManualModal.tsx
  components/frontpage/FrontpageManual.tsx
  components/homepage/HomepageManual.tsx
  components/presentation/PresentationManual.jsx
components/navbar/index.tsx
  auth.ts
  components/navbar/Login.tsx
  components/navbar/SignUp.tsx
  components/navbar/UserManualModal.tsx
  components/navbar/theme-toggle-button.tsx
  components/utils/toastUtils.ts
  public/b_hy_logo.svg
  public/hy_logo.svg
  services/auth.ts
  types/index.ts
  utils/axiosAuthInterceptor.ts
components/navbar/theme-toggle-button.tsx
components/presentation/ColorPicker.jsx
components/presentation/CuesForm.tsx
  components/presentation/ColorPicker.jsx
  components/presentation/MediaPoolTile.tsx
  components/presentation/mediaFileStore.js
  components/utils/Error.tsx
  components/utils/fileTypeUtils.ts
  components/utils/numberInputUtils.ts
  types/index.ts
components/presentation/EditMode.tsx
  components/presentation/EditModeHeaders.tsx
  components/presentation/GridLayoutComponent.tsx
  components/presentation/MultiScreenModal.jsx
  components/presentation/ToolBox.jsx
  components/presentation/editModeDragHelpers.js
  components/presentation/mediaFileStore.js
  components/presentation/timelineMetrics.ts
  components/presentation/useEditModeDragPreviewController.js
  components/presentation/useEditModeDragPreviewState.js
  components/utils/AlertDialog.tsx
  components/utils/CustomAlert.tsx
  components/utils/cueOpacityUtils.ts
  components/utils/cueVisualSpanUtils.ts
  components/utils/fileTypeUtils.ts
  components/utils/formDataUtils.ts
  components/utils/laneFocus.ts
  components/utils/screenRowModel.ts
  components/utils/toastUtils.ts
  public/icons/screen.svg
  redux/hooks.ts
  redux/presentationReducer.ts
  redux/presentationThunks.ts
  types/index.ts
components/presentation/EditModeContainer.tsx
  components/data/tutorialSteps.ts
  components/presentation/EditMode.tsx
  components/presentation/EditorDock.tsx
  components/presentation/PresentationPlaybackControls.jsx
  components/presentation/PresentationTitle.jsx
  components/presentation/Screen.jsx
  components/presentation/ScreensDisplay.tsx
  components/presentation/StatusToolTip.jsx
  components/tutorial/TutorialGuide.tsx
  components/utils/ClickablePopover.tsx
  components/utils/ResizeElement.ts
  components/utils/cueVisualSpanUtils.ts
  components/utils/fileTypeUtils.ts
  components/utils/keyboardHandler.tsx
  components/utils/laneFocus.ts
  public/icons/Presentationsettings.svg
  redux/hooks.ts
  redux/presentationReducer.ts
  types/index.ts
components/presentation/EditModeHeaders.tsx
  components/presentation/timelineMetrics.ts
  components/utils/laneFocus.ts
  components/utils/screenRowModel.ts
  lib/icons.tsx
  public/icons/trash.svg
  types/index.ts
components/presentation/EditorDock.tsx
  components/presentation/CuesForm.tsx
  components/presentation/ScorePanel.tsx
  redux/hooks.ts
  redux/presentationReducer.ts
  types/index.ts
components/presentation/GoogleSignInButton.jsx
  components/presentation/SignInInfoModal.jsx
components/presentation/GridLayoutComponent.tsx
  components/presentation/timelineMetrics.ts
  components/utils/AlertDialog.tsx
  components/utils/cueOpacityUtils.ts
  components/utils/cueVisualSpanUtils.ts
  components/utils/laneFocus.ts
  components/utils/toastUtils.ts
  redux/hooks.ts
  redux/presentationReducer.ts
  types/index.ts
components/presentation/MediaPoolTile.tsx
  components/presentation/mediaFileStore.js
  components/utils/mediaKind.ts
  lib/icons.tsx
  types/index.ts
components/presentation/MultiScreenModal.jsx
components/presentation/PresentationManual.jsx
components/presentation/PresentationPlaybackControls.jsx
  public/icons/pausebutton.svg
  public/icons/playbutton.svg
components/presentation/PresentationTitle.jsx
components/presentation/ScoreMarkerOverlay.tsx
  types/index.ts
components/presentation/ScorePanel.tsx
  components/presentation/ScorePdfViewer.tsx
  components/utils/toastUtils.ts
  redux/hooks.ts
  redux/presentationReducer.ts
  types/index.ts
components/presentation/ScorePdfViewer.tsx
  auth.ts
  components/presentation/ScoreMarkerOverlay.tsx
  components/utils/toastUtils.ts
  redux/hooks.ts
  redux/presentationReducer.ts
  types/index.ts
components/presentation/Screen.jsx
components/presentation/ScreensDisplay.tsx
  components/utils/cueOpacityUtils.ts
  components/utils/cueVisualSpanUtils.ts
  components/utils/fileTypeUtils.ts
  components/utils/screenSpanLayout.ts
  types/index.ts
components/presentation/SignInInfoModal.jsx
components/presentation/StatusToolTip.jsx
components/presentation/ToolBox.jsx
components/presentation/editModeDragHelpers.js
  components/presentation/mediaFileStore.js
components/presentation/index.jsx
components/presentation/mediaFileStore.js
components/presentation/timelineMetrics.ts
components/presentation/useEditModeDragPreviewController.js
components/presentation/useEditModeDragPreviewState.js
  components/presentation/editModeDragHelpers.js
components/privacypage/index.tsx
components/profilepage/profile.tsx
  ../constants.d.ts
  components/utils/Error.tsx
  components/utils/toastUtils.ts
  services/auth.ts
  types/index.ts
components/termspage/index.tsx
components/tutorial/TutorialGuide.tsx
  types/index.ts
components/utils/AlertDialog.tsx
components/utils/ClickablePopover.tsx
components/utils/CustomAlert.tsx
  types/index.ts
components/utils/Error.tsx
components/utils/FeatureSection.tsx
  components/utils/NestedList.tsx
  types/index.ts
components/utils/NestedList.tsx
components/utils/ResizeElement.ts
components/utils/Togglable.tsx
components/utils/config.ts
components/utils/cueOpacityUtils.ts
components/utils/cueVisualSpanUtils.ts
  types/index.ts
components/utils/fileTypeUtils.ts
  types/index.ts
components/utils/firebase.ts
  components/utils/config.ts
components/utils/formDataUtils.ts
  types/index.ts
components/utils/keyboardHandler.tsx
components/utils/laneFocus.ts
  types/index.ts
components/utils/mediaKind.ts
  types/index.ts
components/utils/numberInputUtils.ts
  types/index.ts
components/utils/randomGradient.ts
components/utils/screenRowModel.ts
  types/index.ts
components/utils/screenSpanLayout.ts
components/utils/toastUtils.ts
  types/index.ts
  utils/axiosAuthInterceptor.ts
components/utils/useDeletePresentation.ts
  components/utils/toastUtils.ts
  redux/hooks.ts
  redux/presentationReducer.ts
lib/fonts.tsx
lib/icons.tsx
lib/theme.tsx
main.tsx
  ../../styles.css
  App.tsx
  redux/store.ts
  utils/axiosAuthInterceptor.ts
public/MuViCoIntro.mp4
public/b_hy_logo.svg
public/hy_logo.svg
public/icons/Presentationsettings.svg
public/icons/pausebutton.svg
public/icons/playbutton.svg
public/icons/screen.svg
public/icons/trash.svg
public/introvideopreview-dark.png
public/introvideopreview-light.png
redux/hooks.ts
  redux/store.ts
redux/presentationReducer.ts
  components/utils/formDataUtils.ts
  redux/presentationThunks.ts
  redux/store.ts
  services/presentation.ts
  types/index.ts
redux/presentationThunks.ts
  services/presentation.ts
  types/index.ts
redux/store.ts
  redux/presentationReducer.ts
services/admin.ts
  auth.ts
  types/index.ts
services/auth.ts
  auth.ts
  types/index.ts
services/presentation.ts
  auth.ts
  types/index.ts
services/presentations.ts
  auth.ts
  types/index.ts
services/users.ts
  auth.ts
  types/index.ts
types/index.ts
utils/axiosAuthInterceptor.ts
  services/auth.ts
  types/index.ts
utils/transitionUtils.ts
vite-env.d.ts
```

##### Backend

```
~/MuViCo$ npx madge --extensions js,ts --exclude 'test' src/server
Processed 28 files (408ms)

../constants.js
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
  utils/cueType.js
models/user.js
routes/admin.js
  models/presentation.js
  models/user.js
  utils/middleware.js
routes/driveProxy.js
  utils/drive.js
  utils/logger.js
routes/login.js
  models/user.js
  utils/auth.js
  utils/config.js
  utils/refreshToken.js
  utils/username.js
  utils/verifyToken.js
routes/presentation.js
  models/presentation.js
  utils/config.js
  utils/cueType.js
  utils/drive.js
  utils/helper.js
  utils/logger.js
  utils/middleware.js
  utils/s3.js
routes/presentations.js
  models/presentation.js
  utils/helper.js
  utils/middleware.js
routes/signup.js
  ../constants.js
  models/user.js
  utils/auth.js
routes/terms.js
routes/users.js
  ../constants.js
  models/user.js
  utils/auth.js
  utils/logger.js
  utils/middleware.js
scripts/backfillMediaLibrary.js
  utils/config.js
  utils/mediaLibraryBackfill.js
scripts/migrateLegacyPresentationCues.js
  utils/config.js
  utils/legacyPresentationMigration.js
utils/auth.js
  ../constants.js
utils/config.js
utils/cueType.js
utils/drive.js
  utils/logger.js
utils/helper.js
  utils/drive.js
  utils/logger.js
  utils/s3.js
utils/legacyPresentationMigration.js
  utils/cueType.js
utils/logger.js
utils/mediaLibraryBackfill.js
utils/middleware.js
  models/presentation.js
  models/user.js
  utils/logger.js
utils/refreshToken.js
utils/s3.js
  utils/config.js
  utils/logger.js
utils/username.js
utils/verifyToken.js
  utils/config.js
  utils/logger.js
```
