from app import create_app, init_db
import os
import click # Import click for CLI commands

app = create_app()

# Define a Flask CLI command group
@app.cli.command("init-db")
def init_db_command():
    """Clear existing data and create new tables."""
    with app.app_context(): # Ensure we are in an app context
        init_db(app)
    click.echo("Initialized the database.")

# This block is for the Flask development server (python run.py)
if __name__ == '__main__':
    # You might still want init_db here for direct dev server runs,
    # but the CLI command is cleaner for explicit initialization.
    # Remove the init_db call from here if using the CLI method primarily.
    # with app.app_context():
    #    init_db(app)
    app.run(host='0.0.0.0', port=5000)