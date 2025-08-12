// --- Kanban Board Specific DOM Elements ---
// These will be assigned in initializeKanbanDOMElements after the DOM is fully loaded.
let taskInput, addTaskBtn, todoTasksContainer, inprogressTasksContainer, doneTasksContainer;
let columnElementsMap = {}; // Maps column ID (e.g., 'todo') to its main column HTMLElement
let taskContainers = {};    // Maps column ID to its specific task container div (e.g., 'todoTasks')
let allKanbanColumnDivs;  // NodeList of all elements with class '.kanban-column'

/**
 * Initializes Kanban-specific DOM element variables.
 * This function is crucial and is called by initKanban after the DOM is loaded.
 */
function initializeKanbanDOMElements() {
    console.log("Kanban: Initializing DOM elements...");
    taskInput = document.getElementById('taskInput');
    addTaskBtn = document.getElementById('addTaskBtn');
    todoTasksContainer = document.getElementById('todoTasks');
    inprogressTasksContainer = document.getElementById('inprogressTasks');
    doneTasksContainer = document.getElementById('doneTasks');

    // Map column IDs to their main wrapper elements
    columnElementsMap = {
        todo: document.getElementById('todo'),
        inprogress: document.getElementById('inprogress'),
        done: document.getElementById('done')
    };
    // Map column IDs to the containers where task elements will be appended
    taskContainers = {
        todo: todoTasksContainer,
        inprogress: inprogressTasksContainer,
        done: doneTasksContainer
    };
    // Get all draggable column areas
    allKanbanColumnDivs = document.querySelectorAll('#kanbanContent .kanban-column');

    // --- DOM Element Validation ---
    // It's vital these elements exist for the Kanban board to function.
    if (!taskInput) console.error("Kanban FATAL Error: Task input field with ID 'taskInput' was NOT FOUND.");
    if (!addTaskBtn) console.error("Kanban FATAL Error: Add task button with ID 'addTaskBtn' was NOT FOUND.");
    if (!todoTasksContainer) console.error("Kanban FATAL Error: 'To Do' task container with ID 'todoTasks' was NOT FOUND.");
    if (!inprogressTasksContainer) console.error("Kanban FATAL Error: 'In Progress' task container with ID 'inprogressTasks' was NOT FOUND.");
    if (!doneTasksContainer) console.error("Kanban FATAL Error: 'Done' task container with ID 'doneTasks' was NOT FOUND.");
    
    Object.keys(columnElementsMap).forEach(key => {
        if (!columnElementsMap[key]) console.error(`Kanban FATAL Error: Main column element with ID '${key}' was NOT FOUND.`);
    });

    if (!allKanbanColumnDivs || allKanbanColumnDivs.length === 0) {
        console.warn("Kanban Warning: No Kanban column divs (class '.kanban-column') found within '#kanbanContent'. Drag-and-drop will not function.");
    }
    console.log("Kanban: DOM elements initialization process finished.");
}

// --- Kanban Utility Functions ---

/**
 * Generates a unique ID string for tasks.
 * @returns {string} A unique ID.
 */
function generateId() {
    return 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Briefly changes the background of a column to give visual feedback.
 * @param {HTMLElement} columnElement - The column element to flash.
 */
function flashColumnBackground(columnElement) {
    if (!(columnElement instanceof HTMLElement)) {
        // Silently return if not a valid element to avoid console spam if an ID is wrong.
        // Errors for missing column elements should be caught during initialization.
        return;
    }
    columnElement.classList.add('column-updated');
    setTimeout(() => {
        columnElement.classList.remove('column-updated');
    }, 700); // Duration of the flash effect in milliseconds
}

/**
 * Triggers the confetti animation.
 * Requires the 'confetti' function to be globally available (from the CDN script).
 */
function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 180, // Number of confetti particles
            spread: 100,        // How far the confetti spreads
            origin: { y: 0.6 }, // Starting point of the confetti (0.6 is 60% from the top)
            zIndex: 10000,      // Ensure confetti is above other elements
            angle: 90,          // Angle of spread
            startVelocity: 45,  // Initial speed
            gravity: 0.9,       // How quickly confetti falls
            drift: 0,           // Sideways drift
            ticks: 250,         // How long particles last before disappearing
            colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42'] // Array of color codes
        });
    } else {
        console.warn("Kanban: 'confetti' function is not defined. Confetti animation will not play. Ensure the library is loaded.");
    }
}

// --- Kanban Task Management Functions ---

/**
 * Creates an HTML element for a given task object.
 * @param {object} task - The task object (must have id, text, status properties).
 * @returns {HTMLElement | null} The created task HTMLElement, or null if task data is invalid.
 */
function createTaskElement(task) {
    // Validate the task object structure
    if (!task || typeof task.id !== 'string' || typeof task.text !== 'string' || typeof task.status !== 'string') {
        console.error("Kanban Error: createTaskElement received an invalid task object:", task);
        return null;
    }

    const taskDiv = document.createElement('div');
    taskDiv.id = task.id;
    taskDiv.className = 'task'; // Base class, specific padding/flex defined in CSS or Tailwind in HTML
    taskDiv.draggable = true;

    const taskTextSpan = document.createElement('span');
    taskTextSpan.textContent = task.text;
    taskTextSpan.className = 'task-text-color break-all'; // Ensure text wraps
    taskDiv.appendChild(taskTextSpan);

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '&times;'; // 'x' symbol for delete
    deleteBtn.className = 'delete-btn'; // Styling handled by CSS
    deleteBtn.title = "Delete task";
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.onclick = () => {
        const parentColumnElement = taskDiv.closest('.kanban-column');
        deleteTask(task.id);
        if (parentColumnElement instanceof HTMLElement) {
            flashColumnBackground(parentColumnElement);
        }
    };
    taskDiv.appendChild(deleteBtn);

    // Drag event listeners for the task
    taskDiv.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', task.id); // Set data to be transferred (the task's ID)
        event.target.classList.add('dragging'); // Add styling to the task being dragged
    });
    taskDiv.addEventListener('dragend', (event) => {
        event.target.classList.remove('dragging'); // Remove dragging style when drag ends
    });
    return taskDiv;
}

/**
 * Adds a new task to the 'To Do' column based on user input.
 */
function addTask() {
    if (!taskInput) { // Check if taskInput element is available
        console.error("Kanban Error: Cannot add task - taskInput element is not initialized or not found.");
        return;
    }
    const taskTextVal = taskInput.value.trim(); // Get and trim the input value
    if (taskTextVal === '') { // Check if input is empty
        taskInput.placeholder = "Task description cannot be empty!";
        taskInput.classList.add('border-red-500'); // Visual feedback for error
        setTimeout(() => { // Reset placeholder and border after a delay
            taskInput.placeholder = "Enter task description...";
            taskInput.classList.remove('border-red-500');
        }, 2500);
        return;
    }

    const newTask = { id: generateId(), text: taskTextVal, status: 'todo' };
    const taskElement = createTaskElement(newTask);

    if (taskElement && taskContainers.todo instanceof HTMLElement) {
        taskContainers.todo.appendChild(taskElement); // Add new task to the 'To Do' list
        taskElement.dataset.lastColumn = 'todo'; // For confetti logic on moving to 'Done'
        if (columnElementsMap.todo instanceof HTMLElement) {
            flashColumnBackground(columnElementsMap.todo); // Flash the 'To Do' column
        }
    } else if (!taskContainers.todo) {
        console.error("Kanban Error: 'To Do' task container ('todoTasks') is not a valid HTMLElement. Cannot add task.");
    }
    
    taskInput.value = ''; // Clear the input field
    taskInput.focus(); // Set focus back to input for easy next entry
    saveTasksToLocalStorage(); // Persist tasks
}

/**
 * Deletes a task from the board and updates local storage.
 * @param {string} taskId - The ID of the task to be deleted.
 */
function deleteTask(taskId) {
    const taskElement = document.getElementById(taskId);
    if (taskElement) {
        taskElement.remove(); // Remove from DOM
        saveTasksToLocalStorage(); // Update local storage
    } else {
        console.warn(`Kanban Warning: Attempted to delete task with ID '${taskId}', but it was not found in the DOM.`);
    }
}

// --- Kanban Local Storage Functions ---

/**
 * Saves the current state of all tasks to the browser's local storage.
 */
function saveTasksToLocalStorage() {
    const tasks = [];
    const taskElements = document.querySelectorAll('#kanbanContent .task'); // Get all task elements
    taskElements.forEach(taskElement => {
        const columnElement = taskElement.closest('.kanban-column');
        if (columnElement instanceof HTMLElement) {
            const columnId = columnElement.id; // 'todo', 'inprogress', or 'done'
            const taskTextSpan = taskElement.querySelector('span.task-text-color');
            if (taskTextSpan instanceof HTMLElement) {
                tasks.push({
                    id: taskElement.id,
                    text: taskTextSpan.textContent,
                    status: columnId
                });
            }
        }
    });
    localStorage.setItem('kanbanTasks', JSON.stringify(tasks)); // Store as JSON string
    console.log("Kanban: Tasks saved to local storage.");
}

/**
 * Loads tasks from local storage and populates them onto the board.
 */
function loadTasksFromLocalStorage() {
    console.log("Kanban: Attempting to load tasks from local storage...");
    const storedTasks = localStorage.getItem('kanbanTasks');
    if (storedTasks) {
        try {
            const tasks = JSON.parse(storedTasks);
            if (!Array.isArray(tasks)) { // Basic validation of stored data
                console.error("Kanban Error: Data in local storage ('kanbanTasks') is not a valid array. Clearing storage.");
                localStorage.removeItem('kanbanTasks');
                return;
            }
            tasks.forEach(task => {
                // Further validation for each task object
                if (typeof task.id !== 'string' || typeof task.text !== 'string' || typeof task.status !== 'string') {
                    console.warn("Kanban Warning: Invalid task object found in local storage, skipping:", task);
                    return; // Skip this malformed task
                }
                const taskElement = createTaskElement(task);
                if (!taskElement) return; // Skip if task element creation failed

                const targetContainer = taskContainers[task.status];
                if (targetContainer instanceof HTMLElement) {
                    targetContainer.appendChild(taskElement);
                    taskElement.dataset.lastColumn = task.status; // Set for confetti logic
                    // Apply 'done' styling if task is in the 'done' column
                    if (task.status === 'done') {
                        const taskTextSpan = taskElement.querySelector('span.task-text-color');
                        if (taskTextSpan instanceof HTMLElement) {
                            taskTextSpan.classList.add('task-text-done');
                        }
                    }
                } else {
                    // Fallback: if the designated container is missing, try adding to 'todo'
                    console.warn(`Kanban Warning: Task container for status '${task.status}' not found. Attempting to add to 'todo'.`);
                    if (taskContainers.todo instanceof HTMLElement) {
                        taskContainers.todo.appendChild(taskElement);
                        taskElement.dataset.lastColumn = 'todo'; 
                    } else {
                        console.error(`Kanban Error: 'todo' task container also not found. Cannot place task:`, task);
                    }
                }
            });
            console.log(`Kanban: Successfully loaded ${tasks.length} tasks from local storage.`);
        } catch (error) {
            console.error("Kanban Error: Failed to parse tasks from local storage. Data might be corrupted. Clearing stored tasks.", error);
            localStorage.removeItem('kanbanTasks'); // Clear corrupted data to prevent future errors
        }
    } else {
        console.log("Kanban: No tasks found in local storage.");
    }
}

// --- Kanban Initialization ---
/**
 * Main initialization function for the Kanban board.
 * Sets up DOM elements and attaches all necessary event listeners.
 */
function initKanban() {
    console.log("Kanban: initKanban() called. Starting Kanban board setup...");
    initializeKanbanDOMElements(); // Initialize and validate DOM element references

    // Attach event listener to the "Add Task" button
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addTask);
        console.log("Kanban: Event listener successfully added to 'addTaskBtn'.");
    } else {
        console.error("Kanban FATAL Error: 'addTaskBtn' not found, cannot attach click listener. Adding tasks will not work.");
    }

    // Attach event listener for 'Enter' key press in the task input field
    if (taskInput) {
        taskInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent default form submission if input is in a form
                addTask();
            }
        });
        console.log("Kanban: Event listener successfully added to 'taskInput' for 'Enter' key.");
    } else {
        console.error("Kanban FATAL Error: 'taskInput' not found, cannot attach keypress listener.");
    }

    // Set up drag and drop functionality for each column
    if (allKanbanColumnDivs && allKanbanColumnDivs.length > 0) {
        allKanbanColumnDivs.forEach(columnDiv => {
            // Event when a draggable item is dragged over a column
            columnDiv.addEventListener('dragover', (event) => {
                event.preventDefault(); // Necessary to allow dropping
                columnDiv.classList.add('drag-over'); // Visual feedback
            });
            // Event when a draggable item leaves a column's area
            columnDiv.addEventListener('dragleave', () => {
                columnDiv.classList.remove('drag-over'); // Remove visual feedback
            });
            // Event when a draggable item is dropped onto a column
            columnDiv.addEventListener('drop', (event) => {
                event.preventDefault(); // Prevent default browser action
                columnDiv.classList.remove('drag-over'); // Remove visual feedback
                const taskId = event.dataTransfer.getData('text/plain'); // Get the ID of the dragged task
                const taskElement = document.getElementById(taskId);
                
                if (!taskElement) { // Safety check
                    console.warn(`Kanban Warning: Dropped task element with ID '${taskId}' not found in DOM.`);
                    return;
                }

                const targetColumnId = columnDiv.id; // ID of the column where task is dropped
                const targetTaskContainer = taskContainers[targetColumnId]; // Get the specific task list div

                if (targetTaskContainer instanceof HTMLElement) {
                    const taskTextSpan = taskElement.querySelector('span.task-text-color');
                    
                    // Append to new column only if it's a different container
                    if (taskElement.parentElement !== targetTaskContainer) {
                        targetTaskContainer.appendChild(taskElement);
                    }
                    flashColumnBackground(columnDiv); // Flash the column that received the task
                    
                    // Handle styling and confetti for 'Done' column
                    if (taskTextSpan instanceof HTMLElement) {
                        if (targetColumnId === 'done') {
                            taskTextSpan.classList.add('task-text-done');
                            // Trigger confetti only if newly moved to 'Done'
                            if (taskElement.dataset.lastColumn !== 'done') {
                                triggerConfetti();
                            }
                        } else {
                            taskTextSpan.classList.remove('task-text-done');
                        }
                    }
                    taskElement.dataset.lastColumn = targetColumnId; // Update task's last known column
                    saveTasksToLocalStorage(); // Persist changes
                } else {
                    console.error(`Kanban Error: Target task container for column ID '${targetColumnId}' not found or not an HTMLElement.`);
                }
            });
        });
        console.log("Kanban: Drag and drop event listeners successfully added to columns.");
    } else {
        // This warning is already covered by initializeKanbanDOMElements
    }
    loadTasksFromLocalStorage(); // Load tasks from previous sessions
    console.log("Kanban: initKanban() setup finished.");
}
