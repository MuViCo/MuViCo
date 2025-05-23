export const editModeFeaturesData = [
  {
    title: "Navigation bar",
    items: [
      "Muvico button: Go back to the home page.",
      "Show Mode: Preview your presentation.",
      "Delete Presentation: Remove the current presentation.",
      "Add Element: Insert new elements into your slides.",
      "Storage indicator: Displays how much space has been used. The maximum allowed space is 50 MB.",
      "Save status icon (✔️): This is marked when your changes are successfully saved.",
    ],
  },
  {
    title:
      "Slides section (top row with white boxes labeled Index 0, Index 1, etc.)",
    items: [
      "This shows the order in which your elements will be displayed on the selected screen.",
      "You can add up to 100 slides per screen.",
    ],
  },
  {
    title:
      "Screens section (left side with purple boxes labeled Screen 1, Screen 2, etc. and Audio files)",
    items: [
      "Displays all the screens you can use for your presentation.",
      "You can use up to four screens in your presentation.",
      "Audio files row where only audio media can be uploaded onto.",
    ],
  },
  {
    title: "Audio files have a few extra features:",
    items: [
      "Loop button: Click the button to play the audio continuously.",
      "Speaker icon: Click the icon to mute the audio.",
    ],
  },
  {
    title: "Initial elements (black boxes labeled as initial elements)",
    items: [
      "When creating a new presentation, initial elements are added to all screens at index 0.",
      "These elements can be deleted by clicking the red X button or modified by double-clicking on the element you want to edit.",
      "These elements are added to ensure that the screens start black by default at the beginning of the presentation.",
    ],
  },
  {
    title: "You can add an element in four ways:",
    items: [
      "Click the Add Element button to open the element creation panel.",
      "Double-click anywhere on the screen to open the panel. This will automatically set the screen and index based on where you clicked.",
      "Drag and drop a file directly to the screen.",
      "You can copy an existing element by clicking its copy button, and then click the desired position to paste it.",
    ],
  },
]
export const stepsToAddElementData = [
  {
    title: "Open the Add Element panel",
    items: [
      "Click on the Add Element button to open the element creation panel.",
    ],
  },
  {
    title: "Select the screen",
    items: [
      "The index determines the element's position on the selected screen.",
      "The default index will be the first available index on the selected screen.",
      "You can choose any index between 0-100.",
    ],
  },
  {
    title: "Name the new element",
    items: [
      "Enter a descriptive name for the element to easily identify it later.",
    ],
  },
  {
    title: "Upload media or select Add blank:",
    items: [
      "Click Upload media to add an image or video.",
      "The information button (ℹ️) will show you the allowed file types.",
      "You can also click Add blank to create an empty placeholder.",
    ],
  },
  {
    title: "Submit the Element",
    items: [
      "Click Submit to confirm the addition of your new element to the screen.",
    ],
  },
]

export const editingElementData = [
  {
    title: "You can modify an element in different ways:",
    items: [
      "Click the Add Element button and select the screen (1-4) or audio (5) and index (0-100) of the element you want to change.",
      "Drag and drop a new file on top of the existing element to replace it.",
      "Double-click on the element to open it for editing.",
      "Click the delete button to remove the element.",
      "Drag and drop the element to insert it into a new position. If there is already an element in that position, the two elements will swap places.",
    ],
  },
]

export const showModeFeaturesData = [
  {
    title: "Edit Mode button (top left): Go back to the editing screen.",
    items: [],
  },
  {
    title: "Index navigation (middle section)",
    items: [
      "Index display (e.g., Index 0): Shows the current index being played.",
      "Left and right arrows: Navigate between indexes to control the presentation flow.",
    ],
  },
  {
    title:
      "Screen selection (purple buttons on the top labeled Open screen 1, Open screen 2, etc.)",
    items: [
      "You can display a specific screen by clicking the Open screen button. An adjacent arrow opens a dropdown where you can mirror another screen's elements, ensuring that if a monitor fails during a presentation, those elements remain visible on another screen.",
      "Note that the audio row cannot be opened. The presentation's audio will play on the speaker corresponding to its index, as specified on the controlling computer's output device.",
    ],
  },
  {
    title: "Help button",
    items: [
      "Hovering your mouse on the question mark shows instructions on using keybinds in Show Mode.",
    ],
  },
]
