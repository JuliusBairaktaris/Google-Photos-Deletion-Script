# Google Photos Deletion Script

A modern and resilient script to bulk-delete photos from your Google Photos library. Paste it into the developer console and let it run.

## ✨ Core Features

*   **Modern JavaScript (`async/await`):** Clean, readable, and easy to maintain.
*   **Intelligent Waiting:** Adapts to your network speed by waiting for content to actually load, preventing premature stops.
*   **Stall Detection:** Automatically detects when Google temporarily blocks deletions (rate-limiting). This prevents infinite loops and the script will safely stop.
*   **Robust Error Handling:** Fails gracefully with clear error messages.
*   **Centralized Configuration:** All CSS selectors are in one place for easy updates if Google changes their UI.

## 🚀 How to Use

1.  Navigate to [photos.google.com](https://photos.google.com).
2.  Open the Developer Console (`Ctrl+Shift+J` or `Cmd+Option+J`).
3.  Copy the code from `delete-photos.js`.
4.  Paste it into the console and press **Enter**.
5.  **Do not close the tab.** The script will run until no photos are left.
6.  **If a stall is detected,** the script will stop and instruct you to refresh the page. Simply press `F5` (or `Cmd+R`), then paste and run the script again to continue.

## ⚖️ Why This Script is Better

This script is engineered to be more reliable than older alternatives that use fragile, time-based delays.

*   **This Script (Modern `async/await`):**
    *   **Waits for content, not for time.** It proceeds only when the next batch of photos is actually visible.
    *   **Handles rate-limiting.** Includes stall detection to handle Google's temporary blocks.
    *   The code is sequential and easy to understand, and errors are clearly reported.

*   **Alternative Scripts (Legacy `setTimeout`):**
    *   **Use fixed delays.** They break easily if the network is slow or the UI changes, causing them to fail or stop silently.

## ⚠️ Disclaimer

Use this script at your own risk. It performs a destructive action. I am not responsible for any data loss. It is recommended to test on a small number of photos first.

## 📄 License

MIT
