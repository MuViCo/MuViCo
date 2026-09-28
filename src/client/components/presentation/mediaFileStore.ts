import type { NewCueDragData } from "../../types"

/**
 * Temporary storage for media and sound files during drag-and-drop operations
 * This allows files to be transferred between components via drag events
 */

const mediaStore = {
  files: new Map<string, File>(),
  activeDragData: null as NewCueDragData | null,

  addFile(id: string, file: File) {
    this.files.set(id, file)
  },

  getFile(id: string) {
    return this.files.get(id)
  },

  removeFile(id: string) {
    this.files.delete(id)
  },

  clear() {
    this.files.clear()
  },

  setActiveDragData(dragData?: NewCueDragData | null) {
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
