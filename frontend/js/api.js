const API_BASE_URL = 'http://localhost:5000/api'; // Your backend URL

async function request(endpoint, method = 'GET', data = null, requireAuth = true) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API] Making ${method} request to ${url}`);
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // IMPORTANT: To send cookies for session management
    };

    if (data) {
        options.body = JSON.stringify(data);
        console.log(`[API] Request data:`, data);
    }

    try {
        console.log(`[API] Sending request with options:`, options);
        const response = await fetch(url, options);
        console.log(`[API] Received response with status:`, response.status);
        
        if (response.status === 401 && window.location.pathname !== '/login.html' && window.location.pathname !== '/signup.html') {
            // Unauthorized, redirect to login if not already on login/signup page
            alert('Session expired or not authenticated. Please login.');
            window.location.href = 'login.html';
            return; // Stop further processing
        }
        
        // Try to parse JSON, but if response is empty (e.g., 204 No Content), return it directly
        const contentType = response.headers.get("content-type");
        console.log(`[API] Response content type:`, contentType);
        
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const responseData = await response.json();
            console.log(`[API] Response data:`, responseData);
            
            if (!response.ok) {
                // Log the error message from backend if available
                console.error('[API] Error:', responseData.message || response.statusText);
                // Throw an error object that includes the backend message
                const error = new Error(responseData.message || 'An API error occurred');
                error.data = responseData; // Attach full response data to error
                error.status = response.status;
                throw error;
            }
            return responseData;
        } else {
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[API] Error (non-JSON):', errorText || response.statusText);
                const error = new Error(errorText || 'An API error occurred');
                error.status = response.status;
                throw error;
            }
            return response; // Or await response.text() if you expect text
        }
    } catch (error) {
        console.error(`[API] Error during ${method} request to ${endpoint}:`, error);
        // Re-throw the error so it can be caught by the caller
        if (error instanceof Error) throw error; // Already an error object
        throw new Error(error.toString()); // Convert other types of thrown values to Error objects
    }
}