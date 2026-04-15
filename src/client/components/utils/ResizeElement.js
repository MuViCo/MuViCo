/**
 * makeResizable.js
 * 
 * This module provides a function to make an HTML element resizable by dragging a handle.
 * It listens for mouse events to adjust the size of the target element in real-time.
 * 
 * Usage:
 *   - Call makeResizable(baseElement, handleElement) where:
 *     - baseElement: The HTML element that should be resized.
 *     - handleElement: The HTML element that will act as the drag handle for resizing.
 * 
 * The function sets up event listeners for 'mousedown', 'mousemove', and 'mouseup' to manage the resizing process.
 * It also changes the cursor to indicate that resizing is in progress.
 * 
 * Note: The handleElement can be the same as the baseElement if you want the entire element to be draggable for resizing.
 */

function makeResizable(base_element, handle_element) {
    const resizableBox = base_element;
    const resizeHandle = handle_element;

    // --- State Variables for Dragging ---
    let isResizing = false;

    // 1. MOUSE DOWN: Start the resizing process
    resizeHandle.addEventListener('mousedown', (e) => {
        // Prevent text selection while dragging
        e.preventDefault();
        isResizing = true;
        // Change cursor globally while resizing
        document.body.style.cursor = 'ns-resize';
    });

    // 2. MOUSE MOVE: Update the size while the mouse is held down
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        // Calculate the new width: 
        // Original Right Edge Position - Current Mouse X Position + Original Width

        // Get the current right edge position of the box
        const boxRect = resizableBox.getBoundingClientRect();

        // Calculate the new width based on the mouse's horizontal position relative to the box's top edge
        // e.clientY gives the absolute X position of the mouse on the screen.
        // e.clientY - boxRect.top gives the mouse position relative to the box's top edge.
        let newHeight = e.clientY - boxRect.top;

        // Ensure the minimum width is not zero or negative
        if (newHeight < 50) {
            newHeight = 50;
        }

        // Apply the new width
        resizableBox.style.height = `${newHeight}px`;
    });

    // 3. MOUSE UP: Stop the resizing process
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = 'default';
        }
    });
}


export default makeResizable