(async function () {
  "use strict";

  /**
   * @description Central configuration for selectors and timings.
   */
  const CONFIG = {
    actionDelay: 1000, // A brief, stable delay after clicking the final delete button.
    timeout: 30000, // Time in milliseconds to wait for an element before timing out.
    selectors: {
      checkbox: ".ckGgle[aria-checked=false]",
      photoContainer: "div[jsname='fPosBb']",
      deleteButton: 'button[aria-label="Move to trash"]',
      confirmationButtonText: "Move to trash",
    },
  };

  /**
   * @description A utility function that pauses execution for a specified duration.
   * @param {number} ms - The number of milliseconds to wait.
   */
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * @description Polls for a condition to be met until it returns a truthy value or a timeout is reached.
   * This is essential for reliably interacting with a dynamic single-page application.
   * @param {() => T | null} condition - A function returning the desired element or a truthy value.
   * @param {string} description - A human-readable description for error messages.
   * @param {number} timeout - The maximum time in milliseconds to wait.
   * @returns {Promise<T>} A promise that resolves with the result of the condition.
   * @throws {Error} If the timeout is reached before the condition is met.
   */
  async function waitUntil(condition, description, timeout = CONFIG.timeout) {
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          reject(
            new Error(
              `Timeout: Could not find ${description} after ${
                timeout / 1000
              } seconds.`
            )
          );
          return;
        }
        const result = condition();
        if (result && (result.length > 0 || result.nodeType)) {
          clearInterval(interval);
          resolve(result);
        }
      }, 250); // Poll every 250ms
    });
  }

  /**
   * @description Encapsulates the multi-step deletion process.
   */
  async function executeDeletion() {
    console.log("Initiating deletion...");

    const deleteBtn = await waitUntil(
      () => document.querySelector(CONFIG.selectors.deleteButton),
      'main "Move to trash" button'
    );
    deleteBtn.click();
    console.log("Clicked main delete button.");

    const confirmBtn = await waitUntil(
      () =>
        Array.from(document.querySelectorAll("button")).find(
          (b) => b.textContent === CONFIG.selectors.confirmationButtonText
        ),
      'confirmation "Move to trash" button'
    );
    confirmBtn.click();
    console.log("Clicked confirmation. Waiting for UI to update...");

    await sleep(CONFIG.actionDelay);
  }

  /**
   * @description The main function that orchestrates the entire photo deletion process.
   */
  async function runPhotoDeleter() {
    let totalDeleted = 0;

    console.log(
      "%c--- Google Photos Deletion Script Initialized ---",
      "color: #4CAF50; font-size: 16px; font-weight: bold;"
    );
    console.warn(
      "SAFETY WARNING: Do NOT close this tab or navigate away. The script must remain active."
    );

    while (true) {
      try {
        // Intelligently wait for the next batch of photos to be present in the DOM.
        // This is the key to preventing the script from stopping prematurely.
        await waitUntil(
          () => document.querySelector(CONFIG.selectors.photoContainer),
          "main photo container"
        );
        const checkBoxes = await waitUntil(
          () => document.querySelectorAll(CONFIG.selectors.checkbox),
          "any selectable photo"
        );

        console.log(
          `Found ${checkBoxes.length} visible photos. Selecting all...`
        );
        for (const box of checkBoxes) {
          try {
            box.click();
          } catch (e) {
            console.warn(
              "Could not click a checkbox, it may have been removed from the DOM."
            );
          }
        }
        totalDeleted += checkBoxes.length;

        await sleep(500); // Wait a moment for the selection UI to update.
        await executeDeletion();
      } catch (error) {
        // If waitUntil times out finding selectable photos, it means the page is empty.
        console.log(
          "Could not find any more photos after waiting. Mission accomplished!"
        );
        break; // Exit the loop.
      }
    }

    console.log(
      `Script finished. A total of approximately ${totalDeleted} photos were deleted.`
    );
  }

  // --- SCRIPT EXECUTION ---
  try {
    await runPhotoDeleter();
    console.log(
      "%c--- Script Execution Complete ---",
      "color: #4CAF50; font-size: 16px; font-weight: bold;"
    );
  } catch (error) {
    console.error(
      "%c--- SCRIPT ENCOUNTERED A CRITICAL ERROR ---",
      "color: #F44336; font-size: 16px; font-weight: bold;"
    );
    console.error("The script has stopped unexpectedly. Details below:");
    console.error(error);
    console.warn(
      "Please reload the page and try running the script again if photos remain."
    );
  }
})();
