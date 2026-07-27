/**
 * This file contains the data for the tutorial steps of the presentation page and the home page of the application.
 */

const presentationTutorialSteps = [
  {
    id: "start",
    center: true,
    title: "Presentation Page",
    description: `This is the presentation page where you can edit and view your presentation.
    
Click "Next" to continue the tutorial.

You can also press Enter or the right arrow key on your keyboard to go forward, and the left arrow key to go backward.

Click "Quit Tutorial" or Esc to end the tutorial.`,
  },
  {
    id: "help",
    selector: ".help-button",
    title: "Help Button",
    posLeftNeeded: true,
    description: "View the manual related to the presentation page.",
  },
  {
    id: "open-all-screens-button",
    selector: "#open-all-screens-button",
    title: "Open All Screens",
    description:
      "Click this button to open every screen in its own window and present your show. Each screen can also be opened or closed individually from the screens preview below.",
  },
  {
    id: "presentation-size-info",
    selector: "#screen_preview",
    title: "Screens Preview",
    description:
      "This area shows a preview of each screen in your presentation.",
  },
  {
    id: "edit-presentation-name-button",
    selector: "#edit-presentation-name-button",
    title: "Edit Presentation Name",
    description: "Click this button to edit the name of your presentation.",
  },
  {
    id: "presentations-grid",
    selector: "#presentations-grid",
    title: "Presentation Grid",
    manualLeftPos: 0,
    description:
      "This area displays your presentation elements. You can drag and drop elements here to add them to the presentation.",
  },
  {
    id: "index-boxes",
    selector: ".index-boxes",
    title: "Frames",
    description:
      "These are the frames of your presentation. To add/remove frames, click the +/- buttons. To adjust a specific frame, \
click the dropdown arrow on the top right of it.",
  },
  {
    id: "screen-boxes",
    selector: ".screen-boxes",
    title: "Screens",
    description:
      "These are the screens of your presentation. To add/remove screens, click the +/- buttons.",
  },
  {
    id: "cue-editor-form",
    selector: ".cue-editor-form",
    title: "Add an Element",
    posLeftNeeded: true,
    description:
      "Add a new element by dragging a color, image, video or audio file from here onto the grid. You can also drop a file from your computer directly onto a cell.",
  },
  {
    id: "cue-menu",
    selector: "#cue-screen-1-index-0 [data-testid^=cue-menu-button-]",
    title: "Element Menu",
    description:
      "Click the arrow icon on an element to delete, edit, or copy it. Audio elements also get a loop toggle here.",
  },
  {
    id: "specific-cue",
    selector: "#cue-screen-1-index-0",
    title: "Editing an Element",
    description: "You can also double-click a cue to edit its name.",
  },
  {
    id: "navbar-title",
    selector: "#navbar-presentations-link",
    title: "Return",
    description: "Click here to return to your presentations.",
  },
]

const homePageTutorialSteps = [
  {
    id: "start",
    center: true,
    title: "Welcome to MuViCo!",
    description: `This is your home page where you can manage your presentations.
    
Click "Next" to continue the tutorial.

You can also press Enter or the right arrow key on your keyboard to go forward, and the left arrow key to go backward.

Click "Quit Tutorial" or Esc to end the tutorial.`,
  },
  {
    id: "help",
    selector: ".help-button",
    title: "Help Button",
    posLeftNeeded: true,
    description: "View the manual related to the home page.",
  },
  {
    id: "create-presentation",
    selector: "#presentation-form-togglable",
    title: "Create Presentation",
    description: "Click this button to create a new presentation.",
  },
  {
    id: "link-google-drive",
    selector: "#link-google-drive-button",
    title: "Link Google Drive",
    posLeftNeeded: true,
    description:
      "Click this button to link your Google Drive account for storing presentation assets.",
  },
  {
    id: "presentations-grid",
    selector: "#presentations-grid",
    title: "Presentations Grid",
    description:
      "Your presentations will appear here. Click on a presentation to open it, or use the delete button to remove it.",
  },
]

export { presentationTutorialSteps, homePageTutorialSteps }
