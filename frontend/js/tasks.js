document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const taskForm = document.getElementById('taskForm');
    const taskListUl = document.getElementById('taskList');
    const taskIdInput = document.getElementById('taskId');
    const taskNameInput = document.getElementById('taskName');
    const taskDateInput = document.getElementById('taskDate');
    const taskTimeInput = document.getElementById('taskTime');
    
    const submitTaskButton = document.getElementById('submitTaskButton');
    const submitButtonText = submitTaskButton ? submitTaskButton.querySelector('span') : null;
    const clearTaskFormButton = document.getElementById('clearTaskFormButton');
    const showTaskFormBtn = document.getElementById('showTaskFormBtn');
    const closeFormBtn = document.getElementById('closeFormBtn');
    const taskFormContainer = document.getElementById('taskFormContainer');
    const formTitle = document.getElementById('formTitle');

    const authActionsDiv = document.getElementById('authActions');
    const welcomeMessageSection = document.getElementById('welcomeMessage');
    const taskSection = document.getElementById('taskSection');
    const greetingSpan = document.getElementById('usernameDisplay');
    const noTasksMessage = document.getElementById('noTasksMessage');
    const errorMessageDiv = document.getElementById('errorMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // Show/hide form functionality
    if (showTaskFormBtn) {
        showTaskFormBtn.addEventListener('click', () => {
            taskFormContainer.classList.add('show');
            resetTaskForm();
            taskNameInput.focus();
        });
    }

    if (closeFormBtn) {
        closeFormBtn.addEventListener('click', () => {
            taskFormContainer.classList.remove('show');
        });
    }

    // Helper functions
    function showLoading() {
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    }

    function hideLoading() {
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }

    function displayError(message) {
        if (errorMessageDiv) {
            errorMessageDiv.textContent = message;
            errorMessageDiv.classList.remove('hidden');
            
            // Auto-hide error after 5 seconds
            setTimeout(() => {
                errorMessageDiv.classList.add('hidden');
            }, 5000);
        }
    }
    
    function clearError() {
        if (errorMessageDiv) {
            errorMessageDiv.textContent = '';
            errorMessageDiv.classList.add('hidden');
        }
    }

    // Capitalize first letter of each word
    function capitalizeWords(str) {
        return str.replace(/\b\w/g, l => l.toUpperCase());
    }

    // Format date for display
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    async function checkAuthStatus() {
        try {
            showLoading();
            const status = await request('/auth/status', 'GET', null, false);
            
            if (status.logged_in) {
                // Capitalize first letter of username
                const displayName = capitalizeWords(status.username) || 'User';
                
                if (greetingSpan) greetingSpan.textContent = displayName;
                if (authActionsDiv) {
                    authActionsDiv.innerHTML = `
                        <a href="index.html" class="active"><i class="fas fa-home"></i> Home</a>
                        <a href="about.html"><i class="fas fa-info-circle"></i> About Us</a>
                        <span>Hello, ${displayName}!</span>
                        <button id="logoutButton"><i class="fas fa-sign-out-alt"></i> Logout</button>
                    `;
                    document.getElementById('logoutButton').addEventListener('click', logoutUser);
                }
                
                if (welcomeMessageSection) welcomeMessageSection.classList.add('hidden');
                if (taskSection) taskSection.classList.remove('hidden');
                loadTasks();
            } else {
                if (authActionsDiv) {
                    authActionsDiv.innerHTML = `
                        <a href="index.html" class="active"><i class="fas fa-home"></i> Home</a>
                        <a href="about.html"><i class="fas fa-info-circle"></i> About Us</a>
                        <a href="login.html"><i class="fas fa-sign-in-alt"></i> Login</a>
                        <a href="signup.html"><i class="fas fa-user-plus"></i> Sign Up</a>
                    `;
                }
                
                if (welcomeMessageSection) welcomeMessageSection.classList.remove('hidden');
                if (taskSection) taskSection.classList.add('hidden');
            }
        } catch (error) {
            console.error("Error checking auth status:", error);
            displayError("Could not verify session. Please try logging in.");
            if (authActionsDiv) {
                authActionsDiv.innerHTML = `
                    <a href="index.html" class="active"><i class="fas fa-home"></i> Home</a>
                    <a href="about.html"><i class="fas fa-info-circle"></i> About Us</a>
                    <a href="login.html"><i class="fas fa-sign-in-alt"></i> Login</a>
                    <a href="signup.html"><i class="fas fa-user-plus"></i> Sign Up</a>
                `;
            }
            
            if (welcomeMessageSection) welcomeMessageSection.classList.remove('hidden');
            if (taskSection) taskSection.classList.add('hidden');
        } finally {
            hideLoading();
        }
    }

    async function logoutUser() {
        try {
            showLoading();
            await request('/auth/logout', 'POST');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout failed:', error);
            displayError(error.message || 'Logout failed.');
            hideLoading();
        }
    }

    async function loadTasks() {
        if (!taskListUl) return;
        try {
            showLoading();
            clearError();
            
            const tasks = await request('/tasks', 'GET');
            
            taskListUl.innerHTML = ''; // Clear existing tasks
            
            if (!Array.isArray(tasks)) {
                throw new Error('Invalid response format');
            }
            
            if (tasks.length === 0) {
                if (noTasksMessage) noTasksMessage.classList.remove('hidden');
            } else {
                if (noTasksMessage) noTasksMessage.classList.add('hidden');
                
                tasks.forEach(task => {
                    const li = document.createElement('li');
                    li.setAttribute('data-id', task.id);
                    li.classList.add('fade-in');
                    
                    let dueInfo = '';
                    if (task.due_date) {
                        dueInfo += `<div class="task-meta"><i class="fas fa-calendar"></i> Due: ${formatDate(task.due_date)}`;
                        if (task.due_time) {
                            dueInfo += ` at <i class="fas fa-clock"></i> ${task.due_time}`;
                        }
                        dueInfo += '</div>';
                    }

                    li.innerHTML = `
                        <div class="task-info">
                            <strong>${escapeHTML(task.name)}</strong>
                            ${dueInfo}
                        </div>
                        <div class="task-actions">
                            <button class="edit-btn"><i class="fas fa-edit"></i> Edit</button>
                            <button class="delete-btn danger"><i class="fas fa-trash"></i> Delete</button>
                        </div>
                    `;
                    taskListUl.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
            displayError(error.message || 'Could not load tasks.');
            if (noTasksMessage) {
                noTasksMessage.textContent = 'Error loading tasks.';
                noTasksMessage.classList.remove('hidden');
            }
        } finally {
            hideLoading();
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

            try {
                showLoading();
                if (id) {
                    await request(`/tasks/${id}`, 'PUT', taskData);
                    displaySuccess("Task updated successfully!");
                } else {
                    await request('/tasks', 'POST', taskData);
                    displaySuccess("Task added successfully!");
                }
                
                resetTaskForm();
                taskFormContainer.classList.remove('show'); // Hide form after successful submission
                loadTasks();
            } catch (error) {
                console.error('Failed to save task:', error);
                displayError(error.message || 'Could not save task.');
                hideLoading();
            }
        });
    }

    function displaySuccess(message) {
        // Create a floating success message
        const successEl = document.createElement('div');
        successEl.className = 'success-message';
        successEl.style.position = 'fixed';
        successEl.style.top = '20px';
        successEl.style.right = '20px';
        successEl.style.padding = '15px 20px';
        successEl.style.backgroundColor = '#4CAF50';
        successEl.style.color = 'white';
        successEl.style.borderRadius = '5px';
        successEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        successEl.style.zIndex = '1000';
        successEl.style.opacity = '0';
        successEl.style.transition = 'opacity 0.3s ease';
        successEl.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        document.body.appendChild(successEl);
        
        setTimeout(() => {
            successEl.style.opacity = '1';
        }, 100);
        
        setTimeout(() => {
            successEl.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(successEl);
            }, 300);
        }, 3000);
    }

    if (taskListUl) {
        taskListUl.addEventListener('click', async (e) => {
            if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
                const li = e.target.closest('li');
                const id = li.dataset.id;
                const taskName = li.querySelector('.task-info strong').textContent;
                
                const metaText = li.querySelector('.task-info .task-meta')?.textContent || '';
                const dateMatch = metaText.match(/Due: (\w+ \d+, \d{4})/);
                const timeMatch = metaText.match(/at (\d{2}:\d{2})/);
                
                // Convert formatted date back to YYYY-MM-DD for input field
                let formattedDate = '';
                if (dateMatch && dateMatch[1]) {
                    const dateObj = new Date(dateMatch[1]);
                    formattedDate = dateObj.toISOString().split('T')[0];
                }

                taskIdInput.value = id;
                taskNameInput.value = taskName;
                taskDateInput.value = formattedDate;
                taskTimeInput.value = timeMatch ? timeMatch[1] : '';

                // Update form state
                submitButtonText.textContent = 'Update Task';
                formTitle.textContent = 'Edit Task';
                if (clearTaskFormButton) clearTaskFormButton.classList.remove('hidden');
                
                // Show the form
                taskFormContainer.classList.add('show');
                taskNameInput.focus();
            }

            if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
                const li = e.target.closest('li');
                const id = li.dataset.id;
                const taskName = li.querySelector('.task-info strong').textContent;
                
                // Create and style confirmation modal
                const confirmDelete = confirm(`Are you sure you want to delete "${taskName}"?`);
                
                if (confirmDelete) {
                    try {
                        showLoading();
                        await request(`/tasks/${id}`, 'DELETE');
                        displaySuccess("Task deleted successfully!");
                        
                        // Animate the removal
                        li.style.opacity = '0';
                        li.style.transform = 'translateX(50px)';
                        li.style.transition = 'all 0.3s ease';
                        
                        setTimeout(() => {
                            loadTasks(); // Refresh the list after animation
                        }, 300);
                    } catch (error) {
                        console.error('Failed to delete task:', error);
                        displayError(error.message || 'Could not delete task.');
                        hideLoading();
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
        if (submitButtonText) submitButtonText.textContent = 'Add Task';
        if (formTitle) formTitle.textContent = 'Add New Task';
        if (clearTaskFormButton) clearTaskFormButton.classList.add('hidden');
        clearError();
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
        // Set min date for date input to today
        if (taskDateInput) {
            const today = new Date().toISOString().split('T')[0];
            taskDateInput.min = today;
        }
        
        checkAuthStatus();
    }
});