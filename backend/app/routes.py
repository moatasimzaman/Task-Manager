# backend/app/routes.py
from flask import Blueprint, request, jsonify, session, current_app
from . import mysql
from .auth import login_required
import datetime  # Add this import

tasks_bp = Blueprint('tasks_bp', __name__)

@tasks_bp.route('/tasks', methods=['POST'])
@login_required
def create_task():
    data = request.get_json()
    user_id = session['user_id']
    name = data.get('name')
    due_date = data.get('due_date') 
    due_time = data.get('due_time') 

    if not name:
        return jsonify({"message": "Task name is required"}), 400

    if due_date == "": due_date = None
    if due_time == "": due_time = None
        
    cursor = mysql.connection.cursor() 
    try:
        sql = "INSERT INTO tasks (user_id, name, due_date, due_time) VALUES (%s, %s, %s, %s)"
        cursor.execute(sql, (user_id, name, due_date, due_time))
        mysql.connection.commit()
        task_id = cursor.lastrowid
        current_app.logger.info(f"Task {task_id} created by user {user_id}.")
        return jsonify({"message": "Task created", "task_id": task_id}), 201
    except Exception as e:
        mysql.connection.rollback()
        current_app.logger.error(f"Error creating task for user {user_id}: {e}")
        return jsonify({"message": "Could not create task", "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@tasks_bp.route('/tasks', methods=['GET'])
@login_required
def get_tasks():
    user_id = session['user_id']
    cursor = mysql.connection.cursor() 
    try:
        current_app.logger.info(f"Getting tasks for user {user_id}")
        cursor.execute("SELECT id, name, due_date, due_time FROM tasks WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
        tasks = cursor.fetchall()
        
        # Format the tasks for JSON serialization
        formatted_tasks = []
        for task in tasks:
            formatted_task = {
                'id': task['id'],
                'name': task['name'],
                'due_date': task['due_date'].strftime('%Y-%m-%d') if task['due_date'] else None,
                # Handle time as timedelta object
                'due_time': str(task['due_time']).zfill(8)[:5] if task['due_time'] else None
            }
            formatted_tasks.append(formatted_task)
        
        current_app.logger.info(f"Retrieved {len(formatted_tasks)} tasks")
        return jsonify(formatted_tasks), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching tasks for user {user_id}: {e}", exc_info=True)
        return jsonify({"message": "Could not fetch tasks", "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@tasks_bp.route('/tasks/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    data = request.get_json()
    user_id = session['user_id']
    name = data.get('name')
    due_date = data.get('due_date')
    due_time = data.get('due_time')

    if not name:
        return jsonify({"message": "Task name is required"}), 400
    
    if due_date == "": due_date = None
    if due_time == "": due_time = None

    cursor = mysql.connection.cursor() 
    try:
        cursor.execute("SELECT user_id FROM tasks WHERE id = %s", (task_id,))
        task_owner_dict = cursor.fetchone()
        if not task_owner_dict or task_owner_dict['user_id'] != user_id:
             return jsonify({"message": "Task not found or unauthorized"}), 404
        
        sql = "UPDATE tasks SET name = %s, due_date = %s, due_time = %s WHERE id = %s AND user_id = %s"
        cursor.execute(sql, (name, due_date, due_time, task_id, user_id))
        
        mysql.connection.commit()
        affected_rows = cursor.rowcount

        if affected_rows == 0:
            cursor.execute("SELECT id FROM tasks WHERE id = %s AND user_id = %s", (task_id, user_id))
            if not cursor.fetchone():
                return jsonify({"message": "Task not found"}), 404
            return jsonify({"message": "Task updated (or no change needed)"}), 200
        
        current_app.logger.info(f"Task {task_id} updated by user {user_id}.")
        return jsonify({"message": "Task updated"}), 200
    except Exception as e:
        mysql.connection.rollback()
        current_app.logger.error(f"Error updating task {task_id} for user {user_id}: {e}")
        return jsonify({"message": "Could not update task", "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@tasks_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    user_id = session['user_id']
    cursor = mysql.connection.cursor() 
    try:
        cursor.execute("SELECT user_id FROM tasks WHERE id = %s", (task_id,))
        task_owner_dict = cursor.fetchone()
        if not task_owner_dict or task_owner_dict['user_id'] != user_id:
             return jsonify({"message": "Task not found or unauthorized"}), 404

        cursor.execute("DELETE FROM tasks WHERE id = %s AND user_id = %s", (task_id, user_id))
        mysql.connection.commit()
        affected_rows = cursor.rowcount

        if affected_rows == 0:
            current_app.logger.warning(f"Delete task {task_id} by user {user_id} affected 0 rows, though ownership was checked.")
            return jsonify({"message": "Task not found"}), 404
        current_app.logger.info(f"Task {task_id} deleted by user {user_id}.")
        return jsonify({"message": "Task deleted"}), 200
    except Exception as e:
        mysql.connection.rollback()
        current_app.logger.error(f"Error deleting task {task_id} for user {user_id}: {e}")
        return jsonify({"message": "Could not delete task", "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()