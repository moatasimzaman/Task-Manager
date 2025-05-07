document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const errorMessageDiv = document.getElementById('errorMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // Ensure error message div starts hidden on page load for login/signup
    if(errorMessageDiv) {
        errorMessageDiv.classList.add('hidden');
        errorMessageDiv.textContent = '';
    }

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
            
            // Add shake animation
            errorMessageDiv.style.animation = 'none';
            setTimeout(() => {
                errorMessageDiv.style.animation = 'shake 0.5s ease';
            }, 10);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorMessageDiv.classList.add('hidden');
            }, 5000);
        } else {
            // Fallback if error div is missing for some reason
            alert(message);
        }
    }
    
    function clearError() {
        if (errorMessageDiv) {
            errorMessageDiv.textContent = '';
            errorMessageDiv.classList.add('hidden');
        }
    }

    // Add shake animation to CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();
            showLoading();
            
            const identifier = document.getElementById('identifier').value;
            const password = document.getElementById('password').value;

            try {
                const response = await request('/auth/login', 'POST', { identifier, password }, false);
                if (response && response.message === "Login successful") {
                    // Create a transition effect before redirect
                    document.body.style.opacity = '0';
                    document.body.style.transition = 'opacity 0.5s ease';
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                } else {
                    // Handle cases where the backend might return 200 OK but not the success message
                    displayError(response.message || 'Login attempt returned an unexpected response.');
                    hideLoading();
                }
            } catch (error) {
                console.error('Login failed:', error);
                // Check error status code if available, otherwise use message
                if (error.status === 401) {
                    displayError('Invalid credentials. Please try again.');
                } else {
                    displayError(error.message || 'Login failed. Could not connect or server error.');
                }
                hideLoading();
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();
            showLoading();
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Basic form validation
            if (password.length < 6) {
                displayError('Password must be at least 6 characters long.');
                hideLoading();
                return;
            }

            try {
                const response = await request('/auth/signup', 'POST', { username, email, password }, false);
                if (response && response.message === "User created successfully") {
                    // Create a transition effect before redirect
                    document.body.style.opacity = '0';
                    document.body.style.transition = 'opacity 0.5s ease';
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                } else {
                     displayError(response.message || 'Signup attempt returned an unexpected response.');
                     hideLoading();
                }
            } catch (error) {
                console.error('Signup failed:', error);
                 // Check error status code if available, otherwise use message
                if (error.status === 409) { // 409 Conflict (User exists)
                    displayError('Username or email already exists.');
                } else {
                    displayError(error.message || 'Signup failed. Could not connect or server error.');
                }
                hideLoading();
            }
        });
    }

    // Add input animations
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
        
        // Check if input already has a value (e.g. after page refresh)
        if (input.value) {
            input.parentElement.classList.add('focused');
        }
    });
});