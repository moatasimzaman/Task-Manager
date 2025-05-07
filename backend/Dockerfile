# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies needed for mysqlclient and other potential packages
# Also install build-essential for C compilers, etc.
# Clean up apt lists afterwards to keep image size down
RUN apt-get update && apt-get install -y \
    pkg-config \
    default-libmysqlclient-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container at /app
COPY . .

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Define environment variable (can be overridden)
# FLASK_APP is already set in docker-compose.yml environment or .env
# ENV FLASK_APP run.py
# ENV FLASK_RUN_HOST 0.0.0.0 # FLASK_RUN_HOST is for flask dev server, gunicorn uses --bind

# Command to run the application using Gunicorn for a more production-like setup
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:app"]