from flask import Flask, render_template, redirect, url_for, flash, request, jsonify, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_mail import Mail, Message
from werkzeug.urls import url_parse
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import json
import calendar
import os
from sqlalchemy.sql import func

from config import Config
from models import db, User, Task, Notification, Department, Event


app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
mail = Mail(app)

login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = "Please log in to access this page."

@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))

# Create database tables
from datetime import datetime

@app.context_processor
def inject_now():
    return {'now': datetime.now()}
@app.before_first_request
def create_tables():
    db.create_all()
    # Create admin user if it doesn't exist
    admin = User.query.filter_by(email=app.config['ADMIN_EMAIL']).first()
    if not admin:
        admin = User(
            username='admin', 
            email=app.config['ADMIN_EMAIL'], 
            is_admin=True,
            full_name='Admin User',
            department='Management',
            position='System Administrator',
            profile_image='default_admin.png'
        )
        admin.set_password('admin')  # Default password, should be changed
        db.session.add(admin)
        
        # Create default departments
        departments = ['Management', 'Marketing', 'Sales', 'Development', 'HR', 'Finance']
        for dept_name in departments:
            dept = Department(name=dept_name)
            db.session.add(dept)
        
        db.session.commit()

# Authentication routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        
        if user is None or not user.check_password(password):
            flash('Invalid username or password', 'error')
            return redirect(url_for('login'))
        
        if not user.is_active:
            flash('Your account is deactivated. Please contact the administrator.', 'error')
            return redirect(url_for('login'))
        
        login_user(user, remember=True)
        next_page = request.args.get('next')
        if not next_page or url_parse(next_page).netloc != '':
            next_page = url_for('dashboard')
        
        flash(f'Welcome back, {user.full_name or user.username}!', 'success')
        return redirect(next_page)
    
    return render_template('login.html', title='Sign In - Merry\'s Timeline')

@app.route('/logout')
def logout():
    logout_user()
    flash('You have been logged out successfully.', 'info')
    return redirect(url_for('login'))

# Main routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('home.html', title='Merry\'s Timeline - Task Management System')

@app.route('/dashboard')
@login_required
def dashboard():
    today = datetime.now()
    
    # Get current user's tasks with pagination
    pending_tasks = Task.query.filter_by(assignee_id=current_user.id, status='pending').order_by(Task.due_date).all()
    completed_tasks = Task.query.filter_by(assignee_id=current_user.id, status='completed').order_by(Task.completed_at.desc()).limit(5).all()
    
    # Get user's notifications
    notifications = Notification.query.filter_by(user_id=current_user.id, read=False).order_by(Notification.created_at.desc()).limit(5).all()
    
    # Get upcoming events
    upcoming_events = Event.query.filter(Event.date >= today).order_by(Event.date).limit(3).all()
    
    # Get basic task statistics
    task_stats = {
        'total': Task.query.filter_by(assignee_id=current_user.id).count(),
        'completed_tasks': Task.query.filter_by(assignee_id=current_user.id, status='completed').count(),
        'in_progress_tasks': Task.query.filter_by(assignee_id=current_user.id, status='in_progress').count(),
        'overdue_tasks': Task.query.filter(Task.assignee_id == current_user.id, 
                                     Task.status == 'pending', 
                                     Task.due_date < today).count()
    }
    
    # Create the stats variable that the template is expecting
    stats = {
        'total_tasks': task_stats['total'],
        'completed_tasks': task_stats['completed_tasks'],
        'in_progress_tasks': task_stats['in_progress_tasks'],
        'total_tasks_change': 5,  # You should calculate this from previous week's data
        'completed_tasks_change': 10,  # You should calculate this from previous week's data
        'in_progress_tasks_change': -2,  # You should calculate this from previous week's data
        'overdue_tasks_change': -5  # You should calculate this from previous week's data
    }
    
    # Weekly progress data
    weekly_progress = {
        'dates': ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        'completed': [3, 5, 2, 6, 4, 2, 1],  # Example data, should be computed
        'created': [4, 2, 3, 5, 2, 1, 3]  # Example data, should be computed
    }
    
    # Calculate completion rate
    completion_rate = round((task_stats['completed_tasks'] / task_stats['total']) * 100) if task_stats['total'] > 0 else 0
    
    # Calculate productivity score
    productivity_score = round(completion_rate * 0.8 + (100 - (task_stats['overdue_tasks'] / task_stats['total'] * 100 if task_stats['total'] > 0 else 0)) * 0.2)
    
    # Today's tasks
    today_tasks = Task.query.filter(
        Task.assignee_id == current_user.id,
        func.date(Task.due_date) == func.date(today)
    ).order_by(Task.due_date).all()
    
    # Mock activities data
    activities = [
        {
            'title': 'Task Completed',
            'description': 'You completed the task "Prepare weekly report"',
            'timestamp': '2 hours ago',
            'icon': 'check-circle',
            'color': 'success'
        },
        {
            'title': 'Task Created',
            'description': 'You created a new task "Review marketing materials"',
            'timestamp': '4 hours ago',
            'icon': 'plus-circle',
            'color': 'primary'
        },
        {
            'title': 'Event Reminder',
            'description': 'Upcoming meeting with the product team at 3:00 PM',
            'timestamp': 'Yesterday',
            'icon': 'bell',
            'color': 'warning'
        }
    ]
    
    # Admin statistics
    admin_stats = None
    if current_user.is_admin:
        admin_stats = {
            'total_users': User.query.count(),
            'total_tasks': Task.query.count(),
            'completed_tasks': Task.query.filter_by(status='completed').count(),
            'pending_tasks': Task.query.filter_by(status='pending').count(),
            'overdue_tasks': Task.query.filter(Task.status == 'pending', 
                                              Task.due_date < today).count()
        }
    
    return render_template('dashboard.html', 
                          pending_tasks=pending_tasks, 
                          completed_tasks=completed_tasks, 
                          today=today,
                          notifications=notifications,
                          upcoming_events=upcoming_events,
                          task_stats=task_stats,
                          stats=stats,  # Add the stats object here
                          admin_stats=admin_stats,
                          completion_rate=completion_rate,
                          productivity_score=productivity_score,
                          today_tasks=today_tasks,
                          activities=activities,
                          weekly_progress=weekly_progress,
                          title='Dashboard - Merry\'s Timeline')

# Add the missing edit_task route
@app.route('/edit_task/<int:task_id>')
@login_required
def edit_task(task_id):
    task = Task.query.get_or_404(task_id)
    # Check if user is admin or the assignee
    if not current_user.is_admin and task.assignee_id != current_user.id:
        flash('You do not have permission to edit this task.', 'error')
        return redirect(url_for('dashboard'))
    
    departments = Department.query.all()
    users = User.query.filter_by(is_active=True).all()
    
    return render_template('edit_task.html', 
                          task=task, 
                          departments=departments,
                          users=users,
                          title='Edit Task - Merry\'s Timeline')

@app.route('/calendar')
@login_required
def view_calendar():
    year = int(request.args.get('year', datetime.now().year))
    month = int(request.args.get('month', datetime.now().month))
    
    # Get events for the month
    events = Event.query.all()
    
    return render_template('calendar.html', 
                          year=year, 
                          month=month, 
                          events=events,
                          title='Calendar - Merry\'s Timeline')

@app.route('/api/calendar_data')
@login_required
def calendar_data():
    year = int(request.args.get('year', datetime.now().year))
    month = int(request.args.get('month', datetime.now().month))
    
    # Get first and last day of month
    first_day = datetime(year, month, 1)
    if month == 12:
        last_day = datetime(year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = datetime(year, month + 1, 1) - timedelta(days=1)
    
    # Get tasks
    if current_user.is_admin:
        tasks = Task.query.filter(Task.due_date >= first_day, Task.due_date <= last_day).all()
    else:
        tasks = Task.query.filter(Task.due_date >= first_day, 
                                 Task.due_date <= last_day, 
                                 Task.assignee_id == current_user.id).all()
    
    # Get events
    events = Event.query.filter(Event.date >= first_day, Event.date <= last_day).all()
    
    # Combine data
    calendar_data = {}
    
    # Add tasks
    for task in tasks:
        day = task.due_date.day
        if day not in calendar_data:
            calendar_data[day] = {'tasks': [], 'events': []}
        
        calendar_data[day]['tasks'].append({
            'id': task.id,
            'title': task.title,
            'status': task.status,
            'priority': task.priority,
            'type': 'task'
        })
    
    # Add events
    for event in events:
        day = event.date.day
        if day not in calendar_data:
            calendar_data[day] = {'tasks': [], 'events': []}
        
        calendar_data[day]['events'].append({
            'id': event.id,
            'title': event.title,
            'type': 'event',
            'category': event.category
        })
    
    return jsonify(calendar_data)

# Task routes
@app.route('/tasks')
@login_required
def tasks():
    departments = Department.query.all()
    return render_template('tasks.html', departments=departments, title='Tasks - Merry\'s Timeline')

@app.route('/api/tasks')
@login_required
def get_tasks():
    status_filter = request.args.get('status', None)
    priority_filter = request.args.get('priority', None)
    department_filter = request.args.get('department', None)
    search_query = request.args.get('q', None)
    
    # Base query
    if current_user.is_admin:
        tasks_query = Task.query
    else:
        tasks_query = Task.query.filter_by(assignee_id=current_user.id)
    
    # Apply filters
    if status_filter and status_filter != 'all':
        tasks_query = tasks_query.filter_by(status=status_filter)
    
    if priority_filter and priority_filter != 'all':
        tasks_query = tasks_query.filter_by(priority=priority_filter)
    
    if department_filter and department_filter != 'all' and current_user.is_admin:
        department_users = User.query.filter_by(department=department_filter).all()
        user_ids = [user.id for user in department_users]
        tasks_query = tasks_query.filter(Task.assignee_id.in_(user_ids))
    
    if search_query:
        tasks_query = tasks_query.filter(Task.title.ilike(f'%{search_query}%') | 
                                        Task.description.ilike(f'%{search_query}%'))
    
    # Order tasks
    tasks_query = tasks_query.order_by(Task.due_date.asc())
    
    # Execute query
    tasks = tasks_query.all()
    
    # Format data
    result = []
    for task in tasks:
        task_data = {
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'due_date': task.due_date.strftime('%Y-%m-%d'),
            'status': task.status,
            'priority': task.priority,
            'assignee': task.assignee.username if task.assignee else 'Unassigned',
            'assignee_id': task.assignee_id,
            'assignee_name': task.assignee.full_name if task.assignee else 'Unassigned',
            'creator': task.creator.username if task.creator else 'System',
            'created_at': task.created_at.strftime('%Y-%m-%d'),
            'is_overdue': task.due_date < datetime.now() and task.status == 'pending'
        }
        result.append(task_data)
    
    return jsonify(result)

@app.route('/api/users')
@login_required
def get_users():
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    department_filter = request.args.get('department', None)
    
    users_query = User.query
    
    if department_filter and department_filter != 'all':
        users_query = users_query.filter_by(department=department_filter)
    
    users = users_query.all()
    
    return jsonify([{
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'full_name': user.full_name,
        'department': user.department,
        'position': user.position,
        'is_active': user.is_active,
        'is_admin': user.is_admin,
        'profile_image': user.profile_image
    } for user in users])

@app.route('/api/departments')
@login_required
def get_departments():
    departments = Department.query.all()
    return jsonify([{
        'id': dept.id,
        'name': dept.name
    } for dept in departments])

@app.route('/api/tasks', methods=['POST'])
@login_required
def create_task():
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    
    # Create new task
    task = Task(
        title=data['title'],
        description=data.get('description', ''),
        due_date=datetime.strptime(data['due_date'], '%Y-%m-%d'),
        status='pending',
        priority=data.get('priority', 'medium'),
        assignee_id=data.get('assignee_id'),
        creator_id=current_user.id
    )
    
    db.session.add(task)
    
    # Create notification for assignee
    if task.assignee_id:
        notification = Notification(
            user_id=task.assignee_id,
            content=f"You have been assigned a new task: {task.title}",
            type="task_assigned"
        )
        db.session.add(notification)
    
    db.session.commit()
    
    return jsonify({
        'id': task.id,
        'title': task.title,
        'status': task.status,
        'message': 'Task created successfully'
    }), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    
    # Check if user is admin or the assignee
    if not current_user.is_admin and task.assignee_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    old_status = task.status
    old_assignee_id = task.assignee_id
    
    # Regular users can only update the status
    if not current_user.is_admin:
        task.status = data.get('status', task.status)
        if task.status == 'completed' and old_status != 'completed':
            task.completed_at = datetime.now()
            
            # Notify admin when task is completed
            notification = Notification(
                user_id=task.creator_id,
                content=f"{current_user.full_name or current_user.username} has completed the task: {task.title}",
                type="task_completed"
            )
            db.session.add(notification)
    else:
        task.title = data.get('title', task.title)
        task.description = data.get('description', task.description)
        task.due_date = datetime.strptime(data.get('due_date', task.due_date.strftime('%Y-%m-%d')), '%Y-%m-%d')
        task.status = data.get('status', task.status)
        task.priority = data.get('priority', task.priority)
        task.assignee_id = data.get('assignee_id', task.assignee_id)
        
        # If status changed to completed, update completed_at
        if task.status == 'completed' and old_status != 'completed':
            task.completed_at = datetime.now()
        
        # If assignee changed, create notification for new assignee
        if task.assignee_id and task.assignee_id != old_assignee_id:
            notification = Notification(
                user_id=task.assignee_id,
                content=f"You have been assigned a task: {task.title}",
                type="task_assigned"
            )
            db.session.add(notification)
    
    task.updated_at = datetime.now()
    db.session.commit()
    
    return jsonify({
        'id': task.id,
        'title': task.title,
        'status': task.status,
        'message': 'Task updated successfully'
    })

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    task = Task.query.get_or_404(task_id)
    
    # If task has an assignee, notify them
    if task.assignee_id:
        notification = Notification(
            user_id=task.assignee_id,
            content=f"The task '{task.title}' has been deleted by admin",
            type="task_deleted"
        )
        db.session.add(notification)
    
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({'message': 'Task deleted successfully'})

# User management routes (admin only)
@app.route('/users')
@login_required
def users():
    if not current_user.is_admin:
        flash('You do not have permission to access this page.', 'error')
        return redirect(url_for('dashboard'))
    
    departments = Department.query.all()
    return render_template('users.html', departments=departments, title='User Management - Merry\'s Timeline')

@app.route('/api/users', methods=['POST'])
@login_required
def create_user():
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    
    # Check if username or email already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    # Generate a random password
    import random
    import string
    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    
    # Create new user
    user = User(
        username=data['username'],
        email=data['email'],
        full_name=data.get('full_name', ''),
        department=data.get('department', ''),
        position=data.get('position', ''),
        is_admin=data.get('is_admin', False),
        is_active=data.get('is_active', True),
        profile_image='default.png'
    )
    user.set_password(temp_password)
    
    db.session.add(user)
    db.session.commit()
    
    # Send welcome email with temporary password
    try:
        msg = Message(
            subject="Welcome to Merry's Timeline",
            recipients=[user.email],
            sender=app.config['MAIL_DEFAULT_SENDER']
        )
        
        msg.html = f"""
        <h2>Welcome to Merry's Timeline Task Management System!</h2>
        <p>Hello {user.full_name or user.username},</p>
        <p>Your account has been created successfully. You can now log in using the following credentials:</p>
        <p><strong>Username:</strong> {user.username}<br>
        <strong>Temporary Password:</strong> {temp_password}</p>
        <p>Please change your password after the first login.</p>
        <p>Access the system at: <a href="{request.host_url}">{request.host_url}</a></p>
        <p>Thank you,<br>
        Merry's Timeline Admin Team</p>
        """
        
        mail.send(msg)
    except Exception as e:
        app.logger.error(f"Error sending welcome email: {str(e)}")
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'message': 'User created successfully'
    }), 201

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    user = User.query.get_or_404(user_id)
    data = request.json
    
    # Check if username or email already exists
    if 'username' in data and data['username'] != user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
    
    if 'email' in data and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
    
    # Update user fields
    if 'username' in data:
        user.username = data['username']
    if 'email' in data:
        user.email = data['email']
    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'department' in data:
        user.department = data['department']
    if 'position' in data:
        user.position = data['position']
    if 'is_admin' in data:
        user.is_admin = data['is_admin']
    if 'is_active' in data:
        user.is_active = data['is_active']
    if 'password' in data and data['password']:
        user.set_password(data['password'])
    
    db.session.commit()
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'message': 'User updated successfully'
    })

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Prevent self-deletion
    if user_id == current_user.id:
        return jsonify({'error': 'You cannot delete your own account'}), 400
    
    user = User.query.get_or_404(user_id)
    
    # Handle assigned tasks
    tasks = Task.query.filter_by(assignee_id=user_id).all()
    for task in tasks:
        task.assignee_id = None
    
    # Delete user's notifications
    notifications = Notification.query.filter_by(user_id=user_id).all()
    for notification in notifications:
        db.session.delete(notification)
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'})

# Profile routes
@app.route('/profile')
@login_required
def profile():
    return render_template('profile.html', title='My Profile - Merry\'s Timeline')

@app.route('/api/profile', methods=['PUT'])
@login_required
def update_profile():
    data = request.json
    
    # Check if email already exists
    if 'email' in data and data['email'] != current_user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
    
    # Update user fields
    if 'email' in data:
        current_user.email = data['email']
    if 'full_name' in data:
        current_user.full_name = data['full_name']
    
    # Change password if provided
    if 'current_password' in data and 'new_password' in data:
        if not current_user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        current_user.set_password(data['new_password'])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully'
    })

# Reports routes
@app.route('/reports')
@login_required
def reports():
    return render_template('reports.html', title='Reports - Merry\'s Timeline')

@app.route('/send_report', methods=['POST'])
@login_required
def send_report():
    data = request.json
    report_type = data.get('type', 'summary')
    time_period = data.get('period', 'weekly')
    
    # Get user's tasks based on time period
    today = datetime.now()
    
    if time_period == 'weekly':
        start_date = today - timedelta(days=today.weekday())
        period_name = f"Weekly ({start_date.strftime('%b %d')} - {today.strftime('%b %d, %Y')})"
    elif time_period == 'monthly':
        start_date = datetime(today.year, today.month, 1)
        period_name = f"Monthly ({start_date.strftime('%B %Y')})"
    elif time_period == 'all':
        start_date = datetime(1900, 1, 1)  # All time
        period_name = "All Time"
    else:
        # Default to last 7 days
        start_date = today - timedelta(days=7)
        period_name = f"Last 7 days ({start_date.strftime('%b %d')} - {today.strftime('%b %d, %Y')})"
    
    completed_tasks = Task.query.filter(
        Task.assignee_id == current_user.id,
        Task.status == 'completed',
        Task.completed_at >= start_date
    ).order_by(Task.completed_at.desc()).all()
    
    pending_tasks = Task.query.filter(
        Task.assignee_id == current_user.id,
        Task.status == 'pending'
    ).order_by(Task.due_date).all()
    
    # Create report message
    msg = Message(
        subject=f"{period_name} Task Report from {current_user.full_name or current_user.username}",
        recipients=[app.config['ADMIN_EMAIL']],
        sender=app.config['MAIL_DEFAULT_SENDER']
    )
    
    # Add additional comments if provided
    additional_comments = data.get('comments', '')
    
    
    # Create HTML report
    report_html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 800px; margin: 0 auto; padding: 20px; }}
            h2 {{ color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }}
            h3 {{ color: #2980b9; margin-top: 20px; }}
            .task-list {{ margin-bottom: 30px; }}
            .task-item {{ margin-bottom: 10px; padding: 10px; border-left: 4px solid #3498db; background-color: #f9f9f9; }}
            .high {{ border-left-color: #e74c3c; }}
            .medium {{ border-left-color: #f39c12; }}
            .low {{ border-left-color: #2ecc71; }}
            .task-title {{ font-weight: bold; }}
            .task-details {{ font-size: 0.9em; color: #7f8c8d; }}
            .stats {{ display: flex; justify-content: space-around; margin: 30px 0; }}
            .stat-box {{ text-align: center; padding: 15px; background-color: #f4f6f9; border-radius: 5px; }}
            .stat-number {{ font-size: 24px; font-weight: bold; color: #3498db; }}
            .stat-label {{ font-size: 14px; color: #7f8c8d; }}
            .comments {{ margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #9b59b6; }}
            .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.8em; color: #7f8c8d; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>{period_name} Task Report</h2>
            <p><strong>User:</strong> {current_user.full_name or current_user.username} ({current_user.email})</p>
            <p><strong>Department:</strong> {current_user.department}</p>
            <p><strong>Position:</strong> {current_user.position}</p>
            <p><strong>Report Date:</strong> {today.strftime('%Y-%m-%d %H:%M')}</p>
            
            <div class="stats">
                <div class="stat-box">
                    <div class="stat-number">{len(completed_tasks)}</div>
                    <div class="stat-label">Completed Tasks</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">{len(pending_tasks)}</div>
                    <div class="stat-label">Pending Tasks</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">{len([t for t in pending_tasks if t.due_date < today])}</div>
                    <div class="stat-label">Overdue Tasks</div>
                </div>
            </div>
    """
    
    # Add completed tasks
    report_html += f"""
            <h3>Completed Tasks ({len(completed_tasks)})</h3>
            <div class="task-list">
    """
    
    if completed_tasks:
        for task in completed_tasks:
            report_html += f"""
                <div class="task-item {task.priority}">
                    <div class="task-title">{task.title}</div>
                    <div class="task-details">
                        Completed on: {task.completed_at.strftime('%Y-%m-%d')} | 
                        Priority: {task.priority.capitalize()} | 
                        Due date: {task.due_date.strftime('%Y-%m-%d')}
                    </div>
                    <div class="task-description">{task.description}</div>
                </div>
            """
    else:
        report_html += "<p>No completed tasks during this period.</p>"
    
    report_html += """
            </div>
    """
    
    # Add pending tasks
    report_html += f"""
            <h3>Pending Tasks ({len(pending_tasks)})</h3>
            <div class="task-list">
    """
    
    if pending_tasks:
        for task in pending_tasks:
            status = "Overdue" if task.due_date < today else "Pending"
            report_html += f"""
                <div class="task-item {task.priority}">
                    <div class="task-title">{task.title}</div>
                    <div class="task-details">
                        Status: {status} | 
                        Priority: {task.priority.capitalize()} | 
                        Due date: {task.due_date.strftime('%Y-%m-%d')}
                    </div>
                    <div class="task-description">{task.description}</div>
                </div>
            """
    else:
        report_html += "<p>No pending tasks at this time.</p>"
    
    report_html += """
            </div>
    """
    
    # Add additional comments if provided
    if additional_comments:
        report_html += f"""
            <div class="comments">
                <h3>Additional Comments</h3>
                <p>{additional_comments}</p>
            </div>
        """
    
    report_html += """
            <div class="footer">
                <p>This is an automated report generated from Merry's Timeline Task Management System.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    msg.html = report_html
    
    try:
        mail.send(msg)
        
        # Create a notification for the user
        notification = Notification(
            user_id=current_user.id,
            content=f"Your {period_name} report has been sent to the administrator.",
            type="report_sent"
        )
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({'message': 'Report sent successfully'})
    except Exception as e:
        app.logger.error(f"Error sending report: {str(e)}")
        return jsonify({'error': 'Failed to send report'}), 500

# Event routes (for calendar)
@app.route('/events')
@login_required
def events():
    if not current_user.is_admin:
        flash('You do not have permission to access this page.', 'error')
        return redirect(url_for('dashboard'))
    
    return render_template('events.html', title='Events - Merry\'s Timeline')

@app.route('/api/events')
@login_required
def get_events():
    start_date = request.args.get('start', None)
    end_date = request.args.get('end', None)
    
    events_query = Event.query
    
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
        events_query = events_query.filter(Event.date >= start_date)
    
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d')
        events_query = events_query.filter(Event.date <= end_date)
    
    events = events_query.all()
    
    return jsonify([{
        'id': event.id,
        'title': event.title,
        'description': event.description,
        'date': event.date.strftime('%Y-%m-%d'),
        'category': event.category,
        'created_by': event.created_by.username if event.created_by else 'System'
    } for event in events])

@app.route('/api/events', methods=['POST'])
@login_required
def create_event():
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    
    event = Event(
        title=data['title'],
        description=data.get('description', ''),
        date=datetime.strptime(data['date'], '%Y-%m-%d'),
        category=data.get('category', 'general'),
        created_by_id=current_user.id
    )
    
    db.session.add(event)
    db.session.commit()
    
    return jsonify({
        'id': event.id,
        'title': event.title,
        'date': event.date.strftime('%Y-%m-%d'),
        'message': 'Event created successfully'
    }), 201

@app.route('/api/events/<int:event_id>', methods=['PUT'])
@login_required
def update_event(event_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    event = Event.query.get_or_404(event_id)
    data = request.json
    
    event.title = data.get('title', event.title)
    event.description = data.get('description', event.description)
    event.date = datetime.strptime(data.get('date', event.date.strftime('%Y-%m-%d')), '%Y-%m-%d')
    event.category = data.get('category', event.category)
    
    db.session.commit()
    
    return jsonify({
        'id': event.id,
        'title': event.title,
        'date': event.date.strftime('%Y-%m-%d'),
        'message': 'Event updated successfully'
    })

@app.route('/api/events/<int:event_id>', methods=['DELETE'])
@login_required
def delete_event(event_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    event = Event.query.get_or_404(event_id)
    db.session.delete(event)
    db.session.commit()
    
    return jsonify({'message': 'Event deleted successfully'})

# Notification routes
@app.route('/api/notifications')
@login_required
def get_notifications():
    notifications = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).all()
    
    return jsonify([{
        'id': notification.id,
        'content': notification.content,
        'type': notification.type,
        'read': notification.read,
        'created_at': notification.created_at.strftime('%Y-%m-%d %H:%M')
    } for notification in notifications])

@app.route('/api/notifications/mark_read', methods=['POST'])
@login_required
def mark_notifications_read():
    notification_ids = request.json.get('notification_ids', [])
    
    if notification_ids:
        notifications = Notification.query.filter(
            Notification.id.in_(notification_ids),
            Notification.user_id == current_user.id
        ).all()
        
        for notification in notifications:
            notification.read = True
        
        db.session.commit()
    
    return jsonify({'message': 'Notifications marked as read'})

@app.route('/api/notifications/mark_all_read', methods=['POST'])
@login_required
def mark_all_notifications_read():
    Notification.query.filter_by(user_id=current_user.id, read=False).update({'read': True})
    db.session.commit()
    
    return jsonify({'message': 'All notifications marked as read'})

@app.route('/api/departments', methods=['POST'])
@login_required
def create_department():
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    
    # Check if department already exists
    if Department.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Department already exists'}), 400
    
    department = Department(name=data['name'])
    db.session.add(department)
    db.session.commit()
    
    return jsonify({
        'id': department.id,
        'name': department.name,
        'message': 'Department created successfully'
    }), 201

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('errors/404.html', title='Page Not Found'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('errors/500.html', title='Server Error'), 500

if __name__ == '__main__':
    app.run(debug=True)