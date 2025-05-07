# Task Manager Application (AWS Deployment Project)

## Overview

This project is a simple web-based Task Manager application developed as part of the Application Deployment on AWS Infrastructure assignment. It allows users to sign up, log in, and perform CRUD (Create, Read, Update, Delete) operations on their tasks.

The application follows a separated frontend/backend architecture:

*   **Frontend:** A client-side application built with Vanilla JavaScript, HTML, and CSS that interacts with the backend via REST APIs.
*   **Backend:** A Flask (Python) API service responsible for user authentication, task management logic, and database interactions.
*   **Database:** MySQL is used for data persistence.

The primary goal of the overall project is to deploy this application onto AWS using services like EC2 (for the backend Docker container), Elastic Beanstalk (for the frontend), RDS (for the database), and S3 (for potential file/image uploads - placeholder included). This README focuses on the **local development setup using Docker Compose.**

## Features

*   User Authentication (Signup, Login, Logout) using sessions.
*   Task Management:
    *   Create new tasks with a name, due date, and due time.
    *   View all tasks associated with the logged-in user.
    *   Edit existing tasks.
    *   Delete tasks.
*   RESTful API for decoupling frontend and backend.

## Technology Stack

*   **Frontend:** Vanilla JavaScript, HTML5, CSS3
*   **Backend:** Python 3.9+, Flask
    *   Flask extensions: Flask-MySQLdb, Flask-Bcrypt, Flask-Session, Flask-CORS
*   **WSGI Server:** Gunicorn
*   **Database:** MySQL 8.0
*   **Containerization (Local):** Docker, Docker Compose


## Prerequisites (Local Development)

*   **Docker Desktop:** Installed and running (or Docker Engine + Docker Compose on Linux). Download from [Docker's website](https://www.docker.com/products/docker-desktop/).

## Local Development Setup & Running

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd task-manager-aws
    ```

2.  **Configure Backend Environment Variables:**
    *   Navigate to the `backend` directory: `cd backend`
    *   Create a file named `.env` (copy from `.env.example` if you create one, or create it manually).
    *   Add the following content to `backend/.env`:

        ```dotenv
        FLASK_APP=run.py
        FLASK_ENV=development
        FLASK_DEBUG=1
        # IMPORTANT: Replace with a long, random, and secret string!
        SECRET_KEY='your_very_strong_and_random_secret_key_here'

        # These should match the 'db' service environment in docker-compose.yml
        MYSQL_HOST=db
        MYSQL_USER=taskuser
        MYSQL_PASSWORD=taskpassword
        MYSQL_DB=task_manager_db
        MYSQL_CURSORCLASS=DictCursor
        ```
    *   **Crucially, set a strong `SECRET_KEY`.**
    *   Return to the project root directory: `cd ..`

3.  **Build and Start Containers:**
    *   Make sure Docker Desktop is running.
    *   Open your terminal in the project's root directory (`task-manager-aws/`).
    *   Run the command:
        ```bash
        docker-compose up --build
        ```
    *   This command will:
        *   Build the Docker image for the `backend` service based on `backend/Dockerfile`.
        *   Download the official MySQL 8.0 image if you don't have it.
        *   Start containers for both the `db` (MySQL) and `backend` (Flask/Gunicorn) services.
        *   The first time building the backend image might take a few minutes as it installs dependencies.
    *   You will see logs from both containers in your terminal. Wait until you see messages indicating the database is ready for connections and the backend worker has booted successfully (like `[INFO] Booting worker with pid: ...` and your Flask app's startup logs).

4.  **Initialize the Database:**
    *   The application needs its database tables created. Since the `init_db` function isn't run automatically by Gunicorn, you need to run it manually once the containers are up.
    *   **Open a NEW terminal window/tab.**
    *   Navigate to your project root directory (`task-manager-aws/`).
    *   Run the following command:
        ```bash
        docker-compose exec backend flask init-db
        ```
    *   You should see output confirming the database was initialized (e.g., "Initialized the database."). Check the logs in the *first* terminal (where `docker-compose up` is running) for detailed messages from the `init_db` function.

5.  **Access the Frontend:**
    *   The frontend consists of static files. To ensure proper cookie handling during development (avoiding `file:///` issues), serve the frontend using a simple local HTTP server.
    *   **Open ANOTHER new terminal window/tab.**
    *   Navigate **inside** the `frontend` directory:
        ```bash
        cd frontend
        ```
    *   Run the Python HTTP server:
        ```bash
        python -m http.server 8000
        # Or if that fails: python3 -m http.server 8000
        ```
    *   Open your web browser (Chrome, Firefox, etc.) and go to:
        *   **Signup:** `http://localhost:8000/signup.html`
        *   **Login:** `http://localhost:8000/login.html`

6.  **Access the Backend API (for direct testing):**
    *   The Flask backend API is running and accessible at `http://localhost:5000`.
    *   You can test basic `GET` endpoints in your browser (e.g., `http://localhost:5000/api/auth/status`).
    *   For `POST`, `PUT`, `DELETE` requests, use an API client like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/).

7.  **Access the Database GUI (Optional):**
    *   You can connect to the MySQL database using a GUI tool like MySQL Workbench, DBeaver, TablePlus, etc.
    *   Use the following connection details:
        *   **Host:** `localhost` (or `127.0.0.1`)
        *   **Port:** `3307` (This is the host port mapped in `docker-compose.yml`)
        *   **Username:** `taskuser`
        *   **Password:** `taskpassword`
        *   **Database/Schema:** `task_manager_db`

8.  **Stopping the Application:**
    *   Go to the terminal where `docker-compose up` is running and press `Ctrl + C`.
    *   To remove the containers (but keep the database data volume):
        ```bash
        docker-compose down
        ```
    *   To remove containers AND the database volume (deletes all data):
        ```bash
        docker-compose down -v
        ```
    *   Stop the Python HTTP server in the other terminal by pressing `Ctrl + C`.

## API Endpoints

### Authentication (`/api/auth`)

*   `POST /signup`: Creates a new user account. Expects JSON body: `{ "username": "...", "email": "...", "password": "..." }`.
*   `POST /login`: Logs in a user. Expects JSON body: `{ "identifier": "username_or_email", "password": "..." }`. Sets session cookie.
*   `POST /logout`: Logs out the current user. Clears session.
*   `GET /status`: Checks if the current user is logged in via session cookie.

### Tasks (`/api/tasks`)

*   `POST /`: Creates a new task for the logged-in user. Expects JSON body: `{ "name": "...", "due_date": "YYYY-MM-DD" (optional), "due_time": "HH:MM" (optional) }`. Requires login.
*   `GET /`: Retrieves all tasks for the logged-in user. Requires login.
*   `PUT /<task_id>`: Updates an existing task. Expects JSON body with fields to update. Requires login.
*   `DELETE /<task_id>`: Deletes a specific task. Requires login.

## Testing

*   Use the frontend served via `http://localhost:8000` to test the user flow (Signup, Login, Task CRUD, Logout).
*   Use browser developer tools (F12 -> Console, Network) to inspect requests and errors.
*   Use an API client (Postman/Insomnia) to test backend endpoints directly.
*   Use a database GUI tool (MySQL Workbench/DBeaver) to inspect data in the `users` and `tasks` tables.

## Deployment Notes (AWS)

The ultimate goal is to deploy this application to AWS according to the project requirements:

*   **Frontend:** Deploy static files (HTML, CSS, JS) to **Elastic Beanstalk** (or potentially S3 + CloudFront).
*   **Backend:** Deploy the Flask application as a Docker container on an **Amazon EC2** instance within a VPC.
*   **Database:** Use **Amazon RDS** (MySQL or PostgreSQL) or **DynamoDB**.
*   **Storage:** Use **Amazon S3** for file/image uploads (functionality not yet fully implemented).
*   **Security:** Configure IAM Roles, Security Groups, and potentially HTTPS via ACM/Load Balancer.

This README currently focuses only on the local Docker-based development setup.

## Author(s)

*   Your Name(s) - Add your name(s) here