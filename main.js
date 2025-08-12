// --- Tab Navigation Elements ---
// These will be assigned in initializeTabDOMElements after the DOM is fully loaded.
let tabKanbanBtn, tabCalculatorBtn, kanbanContentDiv, calculatorContentDiv;
let tabButtons = [];  // Array to hold tab button HTMLElements
let tabContents = []; // Array to hold tab content div HTMLElements

/**
 * Initializes Tab Navigation DOM element variables.
 * This function is crucial and is called by initTabs after the DOM is loaded.
 */
function initializeTabDOMElements() {
    console.log("Main: Initializing Tab DOM elements...");
    tabKanbanBtn = document.getElementById('tabKanban');
    tabCalculatorBtn = document.getElementById('tabCalculator');
    kanbanContentDiv = document.getElementById('kanbanContent');
    calculatorContentDiv = document.getElementById('calculatorContent');

    // --- DOM Element Validation ---
    // It's vital these elements exist for tab navigation to function.
    if (tabKanbanBtn && tabCalculatorBtn && kanbanContentDiv && calculatorContentDiv) {
        tabButtons = [tabKanbanBtn, tabCalculatorBtn];
        tabContents = [kanbanContentDiv, calculatorContentDiv];
        console.log("Main: Tab DOM elements successfully initialized and assigned.");
    } else {
        console.error("Main FATAL Error: One or more critical tab navigation elements were NOT FOUND. Tab functionality will be severely impaired or non-functional.");
        // Log which specific elements are missing for easier debugging
        if(!tabKanbanBtn) console.error("Main FATAL Error: Tab button with ID 'tabKanban' was NOT FOUND.");
        if(!tabCalculatorBtn) console.error("Main FATAL Error: Tab button with ID 'tabCalculator' was NOT FOUND.");
        if(!kanbanContentDiv) console.error("Main FATAL Error: Kanban content div with ID 'kanbanContent' was NOT FOUND.");
        if(!calculatorContentDiv) console.error("Main FATAL Error: Calculator content div with ID 'calculatorContent' was NOT FOUND.");
        // Ensure arrays are empty if elements are missing to prevent errors in switchTab
        tabButtons = []; 
        tabContents = [];
    }
    console.log("Main: Tab DOM elements initialization process finished.");
}

/**
 * Switches the active tab by updating visibility and button styles.
 * @param {number} activeIndex - The index of the tab to activate (0 for Kanban, 1 for Calculator).
 */
function switchTab(activeIndex) {
    console.log(`Main: Attempting to switch to tab index ${activeIndex}.`);
    // Check if tab system is properly initialized and index is valid
    if (tabButtons.length === 0 || tabContents.length === 0 || activeIndex < 0 || activeIndex >= tabButtons.length) {
        console.warn(`Main Warning: Cannot switch tabs. Tab elements not initialized correctly or activeIndex ${activeIndex} is out of bounds.`);
        return;
    }

    tabButtons.forEach((button, index) => {
        // Ensure the button and its corresponding content div exist before trying to modify them
        if (button instanceof HTMLElement && tabContents[index] instanceof HTMLElement) {
            if (index === activeIndex) {
                button.classList.add('active-tab');    // Style for the active tab button
                tabContents[index].classList.remove('hidden'); // Show the active tab's content
            } else {
                button.classList.remove('active-tab'); // Remove active style from other tab buttons
                tabContents[index].classList.add('hidden');    // Hide other tab contents
            }
        } else {
            // This case should ideally be caught during initializeTabDOMElements
            console.warn(`Main Warning: Tab button or content at index ${index} is not a valid HTMLElement during switchTab operation.`);
        }
    });
    console.log(`Main: Successfully switched to tab index ${activeIndex}.`);
}

/**
 * Initializes tab switching functionality by attaching event listeners.
 * This function should be called after the DOM is fully loaded.
 */
function initTabs() {
    console.log("Main: initTabs() called. Starting tab system setup...");
    initializeTabDOMElements(); // Initialize and validate DOM element references for tabs

    // Attach click event listeners to tab buttons, if they exist
    if (tabKanbanBtn) {
        tabKanbanBtn.addEventListener('click', () => switchTab(0)); // 0 is the index for Kanban
        console.log("Main: Event listener successfully added to 'tabKanbanBtn'.");
    }
    if (tabCalculatorBtn) {
        tabCalculatorBtn.addEventListener('click', () => switchTab(1)); // 1 is the index for Calculator
        console.log("Main: Event listener successfully added to 'tabCalculatorBtn'.");
    }

    // Set the default active tab (Kanban) if tab elements are available
    if (tabButtons.length > 0 && tabContents.length > 0) {
        switchTab(0); // Default to showing the Kanban tab
    } else {
        console.warn("Main Warning: Default tab could not be set as tab elements are not fully available or initialized.");
    }
    console.log("Main: initTabs() setup finished.");
}

// --- Global Initializations ---
// This event listener ensures that the entire page (DOM, CSS, images, etc.)
// is fully loaded before any script attempts to manipulate the DOM or initialize components.
window.addEventListener('load', () => {
    console.log("Productivity Hub: Event - window.onload triggered. Initializing application components...");

    // Initialize Tab System first, as it controls the visibility of other components
    try {
        console.log("Productivity Hub: Attempting to initialize Tab system...");
        initTabs();
    } catch (e) {
        console.error("Productivity Hub CRITICAL ERROR during Tab system initialization:", e);
    }
    
    // Initialize Kanban Board module
    try {
        console.log("Productivity Hub: Attempting to initialize Kanban module...");
        // Check if the initKanban function is defined (it should be, from kanban.js)
        if (typeof initKanban === 'function') {
            initKanban();
        } else {
            console.error("Productivity Hub CRITICAL ERROR: initKanban function is NOT DEFINED. Kanban board will not function.");
        }
    } catch (e) {
        console.error("Productivity Hub CRITICAL ERROR during Kanban module initialization:", e);
    }

    // Initialize Calculator module
    try {
        console.log("Productivity Hub: Attempting to initialize Calculator module...");
        // Check if the initCalculator function is defined (it should be, from calculator.js)
        if (typeof initCalculator === 'function') {
            initCalculator();
        } else {
            console.error("Productivity Hub CRITICAL ERROR: initCalculator function is NOT DEFINED. Calculator will not function.");
        }
    } catch (e) {
        console.error("Productivity Hub CRITICAL ERROR during Calculator module initialization:", e);
    }
    
    console.log("Productivity Hub: All component initializations attempted. Please check the console for any FATAL ERROR messages. If none, the application should be ready.");
});
