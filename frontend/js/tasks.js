document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('taskForm');
    const taskListUl = document.getElementById('taskList');
    const taskIdInput = document.getElementById('taskId');
    const taskNameInput = document.getElementById('taskName');
    const taskDateInput = document.getElementById('taskDate');
    const taskTimeInput = document.getElementById('taskTime');
    
    const submitTaskButton = document.getElementById('submitTaskButton');
    const clearTaskFormButton = document.getElementById('clearTaskFormButton');

    const authActionsDiv = document.getElementById('authActions');
    const welcomeMessageSection = document.getElementById('welcomeMessage');
    const taskSection = document.getElementById('taskSection');
    const greetingSpan = document.getElementById('usernameDisplay');
    const noTasksMessage = document.getElementById('noTasksMessage');
    const errorMessageDiv = document.getElementById('errorMessage');

    // Debug function - add this to help trace issues
    function debugLog(message, data) {
        console.log(`[DEBUG] ${message}`, data || '');
    }

    function displayError(message) {
        if (errorMessageDiv) {
            errorMessageDiv.textContent = message;
            errorMessageDiv.classList.remove('hidden');
            debugLog('Displaying error:', message);
        }
    }
    
    function clearError() {
        if (errorMessageDiv) {
            errorMessageDiv.textContent = '';
            errorMessageDiv.classList.add('hidden');
            debugLog('Cleared error message');
        }
    }

    async function checkAuthStatus() {
        try {
            debugLog('Checking auth status');
            const status = await request('/auth/status', 'GET', null, false);
            debugLog('Auth status response:', status);
            
            if (status.logged_in) {
                if (greetingSpan) greetingSpan.textContent = status.username || 'User';
                if (authActionsDiv) {
                    authActionsDiv.innerHTML = `
                        <span>Hello, ${status.username || 'User'}!</span>
                        <button id="logoutButton">Logout</button>
                    `;
                    document.getElementById('logoutButton').addEventListener('click', logoutUser);
                }
                
                if (welcomeMessageSection) welcomeMessageSection.classList.add('hidden');
                if (taskSection) taskSection.classList.remove('hidden');
                debugLog('User is logged in, loading tasks');
                loadTasks();
            } else {
                if (authActionsDiv) {
                    authActionsDiv.innerHTML = `
                        <a href="login.html">Login</a>
                        <a href="signup.html">Sign Up</a>
                    `;
                }
                
                if (welcomeMessageSection) welcomeMessageSection.classList.remove('hidden');
                if (taskSection) taskSection.classList.add('hidden');
                debugLog('User is not logged in');
            }
        } catch (error) {
            console.error("Error checking auth status:", error);
            displayError("Could not verify session. Please try logging in.");
            if (authActionsDiv) {
                authActionsDiv.innerHTML = `
                    <a href="login.html">Login</a>
                    <a href="signup.html">Sign Up</a>
                `;
            }
            
            if (welcomeMessageSection) welcomeMessageSection.classList.remove('hidden');
            if (taskSection) taskSection.classList.add('hidden');
        }
    }

    async function logoutUser() {
        try {
            debugLog('Logging out user');
            await request('/auth/logout', 'POST');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout failed:', error);
            displayError(error.message || 'Logout failed.');
        }
    }

    async function loadTasks() {
        if (!taskListUl) return;
        try {
            debugLog('Fetching tasks...');
            clearError(); // Clear any previous errors
            
            const tasks = await request('/tasks', 'GET');
            debugLog('Tasks received:', tasks);
            
            taskListUl.innerHTML = ''; // Clear existing tasks
            
            if (!Array.isArray(tasks)) {
                debugLog('Response is not an array:', tasks);
                throw new Error('Invalid response format');
            }
            
            if (tasks.length === 0) {
                debugLog('No tasks found');
                if (noTasksMessage) noTasksMessage.classList.remove('hidden');
            } else {
                debugLog(`Found ${tasks.length} tasks`);
                if (noTasksMessage) noTasksMessage.classList.add('hidden');
                
                tasks.forEach(task => {
                    debugLog('Processing task:', task);
                    
                    const li = document.createElement('li');
                    li.setAttribute('data-id', task.id);
                    
                    let taskMeta = [];
                    if (task.due_date) taskMeta.push(`Due: ${task.due_date}`);
                    if (task.due_time) taskMeta.push(`at ${task.due_time}`);

                    li.innerHTML = `
                        <div class="task-info">
                            <strong>${escapeHTML(task.name)}</strong>
                            ${taskMeta.length > 0 ? `<div class="task-meta">${taskMeta.join(' ')}</div>` : ''}
                        </div>
                        <div class="task-actions">
                            <button class="edit-btn">Edit</button>
                            <button class="delete-btn danger">Delete</button>
                        </div>
                    `;
                    taskListUl.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
            console.error('Error details:', {
                message: error.message,
                status: error.status,
                data: error.data
            });
            
            displayError(error.message || 'Could not load tasks.');
            if (noTasksMessage) {
                noTasksMessage.textContent = 'Error loading tasks.';
                noTasksMessage.classList.remove('hidden');
            }
        }
    }

    if (taskForm) {
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();
            
            const id = taskIdInput.value;
            const name = taskNameInput.value;
            const due_date = taskDateInput.value || null;
            const due_time = taskTimeInput.value || null;

            const taskData = { name, due_date, due_time };
            debugLog('Submitting task data:', taskData);

            try {
                if (id) {
                    debugLog(`Updating task ${id}`);
                    await request(`/tasks/${id}`, 'PUT', taskData);
                } else {
                    debugLog('Creating new task');
                    const createdTask = await request('/tasks', 'POST', taskData);
                    debugLog('Task created:', createdTask);
                }
                
                resetTaskForm();
                loadTasks();
            } catch (error) {
                console.error('Failed to save task:', error);
                displayError(error.message || 'Could not save task.');
            }
        });
    }

    if (taskListUl) {
        taskListUl.addEventListener('click', async (e) => {
            if (e.target.classList.contains('edit-btn')) {
                const li = e.target.closest('li');
                const id = li.dataset.id;
                const taskName = li.querySelector('.task-info strong').textContent;
                
                const metaText = li.querySelector('.task-info .task-meta')?.textContent || '';
                const dateMatch = metaText.match(/Due: (\d{4}-\d{2}-\d{2})/);
                const timeMatch = metaText.match(/at (\d{2}:\d{2})/);

                taskIdInput.value = id;
                taskNameInput.value = taskName;
                taskDateInput.value = dateMatch ? dateMatch[1] : '';
                taskTimeInput.value = timeMatch ? timeMatch[1] : '';

                submitTaskButton.textContent = 'Update Task';
                if (clearTaskFormButton) clearTaskFormButton.classList.remove('hidden');
                window.scrollTo(0, taskForm.offsetTop);
            }

            if (e.target.classList.contains('delete-btn')) {
                const li = e.target.closest('li');
                const id = li.dataset.id;
                if (confirm('Are you sure you want to delete this task?')) {
                    try {
                        debugLog(`Deleting task ${id}`);
                        await request(`/tasks/${id}`, 'DELETE');
                        loadTasks();
                    } catch (error) {
                        console.error('Failed to delete task:', error);
                        displayError(error.message || 'Could not delete task.');
                    }
                }
            }
        });
    }

    if (clearTaskFormButton) {
        clearTaskFormButton.addEventListener('click', resetTaskForm);
    }

    function resetTaskForm() {
        if (taskForm) taskForm.reset();
        taskIdInput.value = '';
        submitTaskButton.textContent = 'Add Task';
        if (clearTaskFormButton) clearTaskFormButton.classList.add('hidden');
        clearError();
        debugLog('Task form reset');
    }

    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        const stringToEscape = String(str); 
        
        return stringToEscape.replace(/[&<>"']/g, function (match) {
            const replacements = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return replacements[match];
        });
    }

    // Initial Load
    if (document.getElementById('appContent')) {
        debugLog('Initializing app content');
        checkAuthStatus();
    }
});