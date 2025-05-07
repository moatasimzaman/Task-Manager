document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const errorMessageDiv = document.getElementById('errorMessage');

    // Ensure error message div starts hidden on page load for login/signup
    if(errorMessageDiv) {
        errorMessageDiv.classList.add('hidden');
        errorMessageDiv.textContent = '';
    }

    function displayError(message) {
        if (errorMessageDiv) {
            errorMessageDiv.textContent = message;
            errorMessageDiv.classList.remove('hidden');
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

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();
            const identifier = document.getElementById('identifier').value;
            const password = document.getElementById('password').value;

            try {
                const response = await request('/auth/login', 'POST', { identifier, password }, false);
                if (response && response.message === "Login successful") {
                    window.location.href = 'index.html';
                } else {
                    // Handle cases where the backend might return 200 OK but not the success message
                    displayError(response.message || 'Login attempt returned an unexpected response.');
                }
            } catch (error) {
                console.error('Login failed:', error);
                // Check error status code if available, otherwise use message
                if (error.status === 401) {
                    displayError('Invalid credentials. Please try again.');
                } else {
                    displayError(error.message || 'Login failed. Could not connect or server error.');
                }
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await request('/auth/signup', 'POST', { username, email, password }, false);
                if (response && response.message === "User created successfully") {
                    window.location.href = 'index.html'; // Redirect to main page
                } else {
                     displayError(response.message || 'Signup attempt returned an unexpected response.');
                }
            } catch (error) {
                console.error('Signup failed:', error);
                 // Check error status code if available, otherwise use message
                if (error.status === 409) { // 409 Conflict (User exists)
                    displayError('Username or email already exists.');
                } else {
                    displayError(error.message || 'Signup failed. Could not connect or server error.');
                }
            }
        });
    }
});