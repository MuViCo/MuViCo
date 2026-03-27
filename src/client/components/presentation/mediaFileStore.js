/**
 * Temporary storage for media and sound files during drag-and-drop operations
 * This allows files to be transferred between components via drag events
 */

const mediaStore = {
  files: new Map(), // Maps file ID to file object
  
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
  }
}

export default mediaStore
