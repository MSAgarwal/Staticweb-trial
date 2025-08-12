// --- Calculator Specific DOM Elements ---
// These will be assigned in initializeCalculatorDOMElements after the DOM is fully loaded.
let varDInput, varSPInput, varCpInput, varBInput;
let customEquationResultSpan;

/**
 * Initializes Calculator-specific DOM element variables.
 * This function is crucial and is called by initCalculator after the DOM is loaded.
 */
function initializeCalculatorDOMElements() {
    console.log("Calculator: Initializing DOM elements for new equation...");
    varDInput = document.getElementById('varD');
    varSPInput = document.getElementById('varSP');
    varCpInput = document.getElementById('varCp');
    varBInput = document.getElementById('varB');
    customEquationResultSpan = document.getElementById('customEquationResult');

    // --- DOM Element Validation ---
    if (!varDInput) console.error("Calculator FATAL Error: Input field with ID 'varD' was NOT FOUND.");
    if (!varSPInput) console.error("Calculator FATAL Error: Input field with ID 'varSP' was NOT FOUND.");
    if (!varCpInput) console.error("Calculator FATAL Error: Input field with ID 'varCp' was NOT FOUND.");
    if (!varBInput) console.error("Calculator FATAL Error: Input field with ID 'varB' was NOT FOUND.");
    if (!customEquationResultSpan) console.error("Calculator FATAL Error: Result span with ID 'customEquationResult' was NOT FOUND.");
    
    console.log("Calculator: DOM elements initialization process finished for new equation.");
}

// --- Calculator Logic ---
/**
 * Calculates the result of the custom equation based on current input values
 * and updates the display.
 * Equation: ((D * (SP - Cp + B + 74) - 7400) / 1.18) / 100
 */
function calculateAndUpdateResults() {
    // Ensure elements are initialized and available before proceeding
    if (!varDInput || !varSPInput || !varCpInput || !varBInput || !customEquationResultSpan) {
        // Errors for missing elements are logged during initialization.
        return;
    }

    const D = parseFloat(varDInput.value) || 0; // Default to 0 if parsing fails or input is empty
    const SP = parseFloat(varSPInput.value) || 0;
    const Cp = parseFloat(varCpInput.value) || 0;
    const B = parseFloat(varBInput.value) || 0;

    try {
        // Calculate the equation step-by-step for clarity
        const term1 = SP - Cp + B + 74;
        const term2 = D * term1;
        const term3 = term2 - 7400;
        const term4 = term3 / 1.20;
        const finalResult = term4 / 100;

        // Check for NaN or Infinity, although less likely with this specific equation's structure
        // unless inputs themselves are extremely large or invalid.
        if (isNaN(finalResult) || !isFinite(finalResult)) {
            customEquationResultSpan.textContent = "Error (Invalid result)";
        } else {
            customEquationResultSpan.textContent = finalResult.toLocaleString(undefined, { 
                minimumFractionDigits: 2, // Show at least 2 decimal places
                maximumFractionDigits: 4  // Show up to 4 decimal places
            });
        }
    } catch (e) { // Catch any other unexpected errors during calculation
        customEquationResultSpan.textContent = "Error";
        console.error("Calculator Error: An exception occurred during custom equation calculation:", e);
    }
}

// --- Calculator Initialization ---
/**
 * Main initialization function for the Calculator.
 * Sets up DOM elements and attaches input event listeners.
 */
function initCalculator() {
    console.log("Calculator: initCalculator() called. Starting calculator setup for new equation...");
    initializeCalculatorDOMElements(); // Initialize and validate DOM element references

    // Add input event listeners to recalculate results dynamically, only if elements exist
    const inputs = [varDInput, varSPInput, varCpInput, varBInput];
    inputs.forEach(inputField => {
        if (inputField) {
            inputField.addEventListener('input', calculateAndUpdateResults);
            console.log(`Calculator: Event listener successfully added to '${inputField.id}'.`);
        }
    });
    
    calculateAndUpdateResults(); // Perform an initial calculation to populate results based on default input values
    console.log("Calculator: Initial calculation performed for new equation and results displayed.");
    console.log("Calculator: initCalculator() setup finished for new equation.");
}
