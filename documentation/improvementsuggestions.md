# Future Improvement Suggestions

### New features

- **Look into adding the functionality to:**
  - Change your own password
  - Drag and drop multiple elements at the same time to the same screen
  - Select movable elements by either clicking an index/screen or using shortcuts to select all items
  - Stretch elements while editing the presentation
  - Add a random element that displays a random image from a predefined image pool
  - Add audiovisual effects into presentations
  - Have lyrics added automatically into presentations
  - Access the app with the tab key
  - Jump between frames in show mode when presenting a presentation
  - Copy and paste a chunk of elements at once
  - Have multiple audio tracks playing at the same time in presentations
  - Overlap visual elements in one element
  - Incorporate live feed in presentations
  - Save duplicate frames on a per-presentation basis so that they don't take up extra space when used multiple times
  - Add autoplay times for individual frames

For more details, see the Autumn 2025 Backlog [here](https://github.com/orgs/MuViCo/projects/11/views/1?filterQuery=status%3A%22Backlog%22).

## Suggestions from earlier teams

*Note: This is a list of suggestions from previous teams, as of December 2025. If you wish to read through these, make sure to note any that have potentially already been implemented.*

### Cue Terminology

- **Issue:**  
  The term "Cue" is used inconsistently throughout the codebase.
  - In some functions, like `addCue`, it refers to an element.
  - Elsewhere, for example in `addInitialElements`, a different term is used.
- **Recommendation:**  
  Consider standardizing terminology—using "element" throughout—in order to avoid confusion. This change will clarify that a Cue represents one element in the presentation grid.

### Grid Rendering and Performance

- **Issue:**  
  Moving the mouse over the grid causes the `EditMode` component to re-render on every action.
  - This might be impacting performance by doing unnecessary re-renders.
- **Recommendation:**  
  Investigate optimizing the component render logic.

  - Consider using the React Profiler (available in React DevTools) to analyze component performance. (If the performance seems fine, focus on other improvements.)
  - **Potential Solution:**  
    Use React’s `useMemo` (or similar hook) to memoize values and avoid unnecessary re-renders.
  - **Goal:**  
    Ensure that the MuViCo application runs efficiently on both user and developer machines.

### Test environment

- Ensure that tests run in isolated environments to avoid race conditions when multiple developers run (backend) tests simultaneously.

- For more details, see Pull Request [#364](https://github.com/MuViCo/MuViCo/pull/364)

### User Profile and Configuration

- **Idea:**  
  Implement a "User Profile" feature that saves user-specific configurations (e.g, the selected storage mode).

### Package Dependency Warning

- **Issue:**  
  The following npm warning is observed:  
  `"npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful."`
- **Recommendation:**
  - Address this issue through the `package.json` file using the "overrides" field.

### AWS Media Database File Duplication

- **Issue:**  
  When using AWS as the media database, copying a file results in duplicate entries in the database.
- **Recommendation:**
  - Consider modifying the logic so that only one file exists (with the front-end displaying it in multiple locations as needed).
  - **Current Reference:**  
    A similar approach is already implemented when using Google Drive by modifying the Presentation MongoDB schema to include a `drive_id` for the file.

### Tutorial Integration

- Consider using libraries such as Reactour or React Joyride for nice in-depth UI tutorial.

  - **Compatibility Issue:**  
    MuViCo currently uses React 19.0.0, while these libraries require older versions of React.
  - **Recommendation:**  
    Wait for these libraries to update their React dependency before integrating them.

- More information and documentation [here](https://github.com/orgs/MuViCo/projects/9/views/7?pane=issue&itemId=107909158&issue=MuViCo%7CMuViCo%7C395)

### **Diversify Media Content:**

- Expand the variety of supported video files. This will enrich the user experience and provide more flexibility.

### **Enable Lyrics Addition:**

- Explore the possibility of allowing users to add lyrics to the platform. Consider leveraging Musixmatch API to enhance the accuracy and relevance of the lyrics. This will enrich the content available on the platform and provide users with additional value.

### **Introduce effect features**

- Currently there is a default crossfade effect when changing index from image to image. Consider adding more effects that could be both audio and visual, such as sound- and transition effects to enrich the user experience.

### **Random element**

- Introduce a new type of element which contains a pool of media that gets displayed randomly for the duration of the element. This makes it easier for the user to generate bigger presentations where the order of the media isn't relevant.
