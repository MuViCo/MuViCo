# Limitations

### Normal user:
- Creating an account via signup creates a "normal user"
- Media size is limited to 50Mb maximum

### Admin:
- Admin has the power to:
    - Delete normal users
    - View and delete media/presentations of all users
    - Assign admin powers to normal users
- Admin users have no media limit in presentations

### Technical limitations:
- As of now, team Muvico does not recommend uploading media which exceeds the filesize of 100Mb. This, in the worst scenario, may break the server.

### Amount of screens in a presentation:
- A limitation for the amount of screens is the responsiveness of the UI.
  - With some structural changes, the responsiveness could be improved.
     - Currently, in Edit Mode the grid is re-rendered with every mouse move the user makes. This may cause unnecessary use of resources, further causing the unresponsiveness or lag.
- Trying to find the maximum amount of screens, I was able to add up to 15 working screens to the app.
  - With 15 screens all functionality did work, however the app was lagging.
  - I measured rendering times, memory footprints and CPU usage, while also observing user-friendliness of the app's UI.
  - I came to the conclusion that 8 screens is an appropriate maximum amount.
  - With 8 screens, rendering times and memory footprint grew an acceptable amount and the UI was responsive with no lag.
  - In Show Mode you could open all the screens and everything worked perfectly.
- As of December 2025, MuViCo has been expanded to support up to **8 screens**.

  
