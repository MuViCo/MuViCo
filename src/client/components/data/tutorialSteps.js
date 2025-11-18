const presentationTutorialSteps = [
    { id: "start", center: true, title: "Presentation Page",
    description: `This is the presentation page where you can edit and view your presentation.
    
Click "Next" to continue the tutorial.

You can also press the left and right arrow keys on your keyboard to go forward and backward.

Click "Quit Tutorial" or Esc to end the tutorial.` },
    { id: "help", selector: ".help-button", title: "Help Button", posLeftNeeded: true,
    description: "View the manual related to the presentation page." },
    { id: "toggle-show-mode-button", selector: "#toggle-show-mode-button", title: "Toggle Show/Edit Mode",
    description: `Click this button to switch between Show mode and Edit mode.
    
(What does that mean? View the manual from the help page button for more details!)` },
    { id: "delete-presentation-button", selector: "#delete-presentation-button", title: "Delete Presentation",
    description: "Click this button to delete the current presentation." },
    { id: "add-element-button", selector: "#add-element-button", title: "Add Element",
    description: "Click this button to add new elements to your presentation." },
    { id: "presentation-size-info", selector: ".presentation-size-info", title: "Presentation Size",
    description: "This text shows the current size of your presentation assets." },
    { id: "presentations-grid", selector: "#presentations-grid", title: "Presentation Grid", manualLeftPos: 0,
    description: "This area displays your presentation elements. In Edit mode, you can modify them; in Show mode, you can view them in action." },
    { id: "index-boxes", selector: ".index-boxes", title: "Frames",
    description: "These are the frames of your presentation. To add/remove frames, click the +/- buttons. To adjust a specific frame, \
click the dropdown arrow on the top right of it." },
    { id: "screen-boxes", selector: ".screen-boxes", title: "Screens",
    description: "These are the screens of your presentation. To add/remove screens, click the +/- buttons." },
    { id: "specific-cue", selector: "#cue-screen-1-index-0", title: "Editing an Element",
    description: "You can also double-click a specific empty cue to add an element to it. If it already has an element, you can double-click it to edit it." },
    { id: "navbar-title", selector: "#navbar-title", title: "Return",
    description: "Click here to return to your presentations." },
]

const homePageTutorialSteps = [
    { id: "start", center: true, title: "Welcome to MuViCo!",
    description: `This is your home page where you can manage your presentations.
    
Click "Next" to continue the tutorial.

You can also press the left and right arrow keys on your keyboard to go forward and backward.

Click "Quit Tutorial" or Esc to end the tutorial.` },
    { id: "help", selector: ".help-button", title: "Help Button", posLeftNeeded: true,
    description: "View the manual related to the home page." },
    { id: "create-presentation", selector: "#presentation-form-togglable", title: "Create Presentation",
    description: "Click this button to create a new presentation." },
    { id: "link-google-drive", selector: "#link-google-drive-button", title: "Link Google Drive", posLeftNeeded: true,
    description: "Click this button to link your Google Drive account for storing presentation assets." },
    { id: "presentations-grid", selector: "#presentations-grid", title: "Presentations Grid",
    description: "Your presentations will appear here. Click on a presentation to open it, or use the delete button to remove it." },
]

export { presentationTutorialSteps, homePageTutorialSteps }