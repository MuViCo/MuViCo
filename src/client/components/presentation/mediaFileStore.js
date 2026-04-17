/**
 * Temporary storage for media and sound files during drag-and-drop operations
 * This allows files to be transferred between components via drag events
 */

const mediaStore = {
  files: new Map(), // Maps file ID to file object
  activeDragData: null,
  
  addFile(id, file) {
    this.files.set(id, file)
  },
  
  getFile(id) {
    return this.files.get(id)
  },
  
  removeFile(id) {
    this.files.delete(id)
  },
  
  clear() {
    this.files.clear()
  },

  setActiveDragData(dragData) {
    this.activeDragData = dragData || null
  },

  getActiveDragData() {
    return this.activeDragData
  },

  clearActiveDragData() {
    this.activeDragData = null
  },
}

export default mediaStore
