export const editModeFeaturesData = [
  {
    title: "Navigation bar",
    items: [
      "Muvico button: Go back to the home page.",
      "Show Mode: Preview your presentation.",
      "Delete Presentation: Delete the current presentation.",
      "Add Element: Insert new elements into your presentation.",
      "Select Transition: Choose how elements transition between frames.",
      "Storage indicator: Displays how much space has been used. The maximum allowed space is 50 MB.",
      "Save status icon (✓): This is marked when your changes have been successfully saved.",
    ],
  },
  {
    title:
      "Frames section (top row with white boxes labeled Starting Frame, Frame 1, Frame 2, etc.)",
    items: [
      "This shows the order in which your elements will be displayed on the selected screen.",
      "Initially starts with 1 starting frame and 4 extra frames.",
      "Additional frames at the end can be added or removed by clicking the +/- buttons.",
      "You can also add frames in between existing frames by clicking the dropdown arrow on the top right of a frame box and selecting 'Add Frame After'.",
      "You can also remove specific frames (except the Starting Frame) by clicking the dropdown arrow and selecting 'Delete Frame'.",
      "You can have anywhere from 1 to 100 frames per screen.",
    ],
  },
  {
    title:
      "Screens section (left side with purple boxes labeled Screen 1, Screen 2, etc. and Audio files)",
    items: [
      "Displays all the screens you can use for your presentation.",
      "You can use multiple screens in your presentation.",
      "Additional screens can be added or removed by clicking the +/- buttons.",
      "The \"Audio files\" row is used only for audio files. Only audio files can be uploaded on this row.",
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
      "When creating a new presentation, initial elements are added to all screens at the starting frame.",
      "These elements can be deleted by clicking the red X button or modified by either double-clicking on the element or clicking the pencil icon.",
      "These elements are added to ensure that the screens start black by default at the beginning of the presentation.",
    ],
  },
  {
    title: "You can add an element in four different ways:",
    items: [
      "Click the Add Element button to open the element creation panel.",
      "Double-click anywhere on the screen to open the panel. This will automatically set the screen and frame based on where you clicked.",
      "Drag and drop a file directly to the screen.",
      "You can copy an existing element by clicking its copy button, and then click on desired positions to paste it.",
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
      "The frame determines the element's position on the selected screen.",
      "The default frame will be the first available frame on the selected screen.",
      "You can choose any frame between 0 (starting frame) and the highest frame number on your project.",
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
      "You can also click \"Add blank\" to create an empty placeholder.",
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
      "Click the Add Element button and select the screen (min 1, up to 8) or audio (highest screen number) and frame (min 0, up to highest frame number) of the element you want to change.",
      "Drag and drop a new file on top of the existing element to replace it.",
      "Double-click on the element or click the pencil icon to open it for editing.",
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
    title: "Frame navigation (middle section)",
    items: [
      "Frame display (e.g., Starting Frame, Frame 1, etc): Shows the current frame being played.",
      "Left and right arrows: Navigate between frames to control the presentation flow.",
    ],
  },
  {
    title:
      "Screen selection (purple buttons on the top labeled Open screen 1, Open screen 2, etc.)",
    items: [
      "You can display a specific screen by clicking the Open screen button or open them all at the same time clicking Open all Screens button. An adjacent arrow opens a dropdown where you can mirror another screen's elements, ensuring that if a monitor fails during a presentation, those elements remain visible on another screen.",
      "Note that the audio row cannot be opened. The presentation's audio will play on the speaker corresponding to its frame, as specified on the controlling computer's output device.",
    ],
  },
  {
    title:
      "Autoplay",
    items: [
      "Autoplay allows you to automatically progress through the frames at a set interval.",
      "Each frame is displayed for the number of seconds you enter in the box.",
      "Open the wanted screens and click “Start Autoplay” to begin playing the frames automatically.  Autoplay always starts from the Starting Frame.",
      "You can also switch the frames manually and change the sec/frame during the Autoplay.",
      "Autoplay stops automatically after the last frame.",
      "You can stop it manually at anytime by clicking “Stop Autoplay.”"
    ]
  },
  {
    title: "Help button",
    items: [
      "Hovering your mouse on the question mark shows instructions on using keybinds in Show Mode.",
    ],
  },
]