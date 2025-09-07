(async function () {
  "use strict";

  /**
   * @description Central configuration for selectors and timings.
   */
  const CONFIG = {
    actionDelay: 1000, // A brief, stable delay after clicking the final delete button.
    timeout: 30000, // Time in milliseconds to wait for an element before timing out.
    stallLimit: 5, // The number of consecutive failed deletions before stopping.
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
    let stallCounter = 0; // Counter for consecutive failed deletions.

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
        const photoCountBefore = checkBoxes.length; // Count photos before deletion.

        console.log(
          `Found ${photoCountBefore} visible photos. Selecting all...`
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

        await sleep(500); // Wait a moment for the selection UI to update.
        await executeDeletion();

        // --- STALL DETECTION LOGIC ---
        let photoCountAfter = 0;
        try {
          // Check for photos again to verify deletion was successful.
          const checkBoxesAfter = await waitUntil(
            () => document.querySelectorAll(CONFIG.selectors.checkbox),
            "any selectable photo",
            5000
          );
          photoCountAfter = checkBoxesAfter.length;
        } catch (e) {
          // If no photos are found, it means the batch was successfully deleted.
          photoCountAfter = 0;
        }

        if (photoCountAfter >= photoCountBefore) {
          stallCounter++;
          console.warn(
            `[WARNING] Deletion appears to have failed. Photo count did not decrease. Stall attempt ${stallCounter}/${CONFIG.stallLimit}.`
          );
          if (stallCounter >= CONFIG.stallLimit) {
            // Throw an error to stop the script if the stall limit is reached.
            throw new Error(
              `Stall Detected. Google is likely rate-limiting you. The script will now stop.`
            );
          }
        } else {
          // If deletion was successful, reset the counter and update the total.
          stallCounter = 0;
          const newlyDeleted = photoCountBefore - photoCountAfter;
          totalDeleted += newlyDeleted;
          console.log(
            `Successfully deleted a batch of ${newlyDeleted}. Total deleted so far: ${totalDeleted}`
          );
        }
      } catch (error) {
        // If waitUntil times out finding selectable photos, it means the page is empty.
        if (error.message.includes("any selectable photo")) {
          console.log(
            "Could not find any more photos after waiting. Mission accomplished!"
          );
        } else {
          // This catches the stall error or any other unexpected errors.
          console.error(
            `%c[SCRIPT HALTED] ${error.message}`,
            "color: #F44336; font-weight: bold; font-size: 14px;"
          );
          console.log(
            "%cTo continue, manually refresh the page (F5) and run the script again.",
            "color: #FFC107;"
          );
        }
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
