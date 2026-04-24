/**
 * This file contains the data for the features of the presentation page of the application.
 */

export const editModeFeaturesData = [
  {
    title: "Rename the presentation title",
    items: [
      "Click the pencil icon next to the presentation name to edit it.",
      "Save or cancel the changes."
    ],
  },
  {
    title: "Edit frame count",
    items: [
      "Add a frame: Click the '+' button to add a new frame.",
      "Remove a frame: Click the 'x' button above the frame to remove it.",
    ],
  },
  {
    title: "Edit screen count",
    items: [
      "Add a screen: Click the '+' button on the last screen header to add a new screen.",
      "Remove a screen: Click the '-' button on the screen header to remove a screen.",
    ],
  },
  {
    title: "Keyboard shortcuts",
    items: [
      "Next index: → ArrowRight, ↑ ArrowUp, PageDown",
      "Previous index: ← ArrowLeft, ↓ ArrowDown, PageUp",
    ],
  }
]

export const stepsToAddElementData = [
  {
    title: "Different types of elements:",
    items: [
      "Color: Choose a color element using the color picker or palette.",
      "Media: Upload an image or video.",
      "Audio: Upload an audio file.",
    ],
  },
  {
    title: "Add details to color element (optional)",
    items: [
      "Name: Give the element a clear name.",
    ],
  },
  {
    title: "Place the element in the editor",
    items: [
      "Drag and drop the element into the frame where you want to place it.",
    ],
  },
]

export const editingElementData = [
  {
    title: "Choose the element to edit",
    items: [
      "Click the top-right corner of the element to open the dropdown menu.",
    ],
  },
  {
    title: "Delete",
    items: [
      "Remove the element from the presentation.",
    ],
  },
  {
    title: "Edit",
    items: [
      "Change the element name or add one.",
      "You can also rename an element by double-clicking it.",
    ],
  },
  {
    title: "Copy",
    items: [
      "Create a duplicate of the element.",
      "Place the duplicate in a different frame by clicking the target location.",
      "Exit copy mode by clicking outside the grid.",
    ],
  },
]

export const screenAndPlaybackData = [
  {
    title: "Frame navigation arrows",
    items: [
      "Use the 'Previous' and 'Next' arrow buttons to move between frames.",
      "The current frames can be seen in the screen preview area.",
    ],
  },
    {
    title: "Open one screen",
    items: [
      "Click 'Open' on a screen to view it in the current frame.",
    ],
  },
  {
    title: "Open all screens",
    items: [
      "Click 'Open all screens' to view all screens in the current frame simultaneously.",
    ],
  },
  {
    title: "Autoplay",
    items: [
      "Each frame is shown for the sec/frame value.",
      "By default, autoplay starts from the starting frame.",
      "To start from another frame, click that frame first.",
      "Autoplay stops at the last frame, or you can stop it any time with 'Stop Autoplay'.",
    ],
  },
]