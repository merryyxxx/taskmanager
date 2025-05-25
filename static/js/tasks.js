document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const tasksList = document.getElementById('tasksList');
    const emptyState = document.getElementById('emptyState');
    const noResultsFound = document.getElementById('noResultsFound');
    const loadingSpinner = document.querySelector('.loading-spinner');
    
    // Filters
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const searchFilter = document.getElementById('searchFilter');
    const searchButton = document.getElementById('searchButton');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const departmentFilter = document.getElementById('departmentFilter');
    
    // Sort options
    const sortOptions = document.querySelectorAll('.sort-option');
    
    // Pagination
    const taskPagination = document.getElementById('taskPagination');
    
    // Variables
    let currentTasks = [];
    let currentSort = 'due_date';
    let currentSortDirection = 'asc';
    let currentPage = 1;
    const tasksPerPage = 10; // You can adjust this value
    
    // Load tasks initially
    loadTasks();
    
    // Load users for task assignment (admin only)
    const isAdmin = document.querySelector('[data-bs-target="#addTaskModal"]') !== null;
    if (isAdmin) {
        loadUsers();
    }
    
    // Event listeners for filters
    statusFilter.addEventListener('change', loadTasks);
    priorityFilter.addEventListener('change', loadTasks);
    searchButton.addEventListener('click', loadTasks);
    searchFilter.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loadTasks();
        }
    });
    
    if (isAdmin && departmentFilter) {
        departmentFilter.addEventListener('change', loadTasks);
    }
    
    // Clear filters
    clearFiltersBtn.addEventListener('click', function() {
        statusFilter.value = 'all';
        priorityFilter.value = 'all';
        searchFilter.value = '';
        if (isAdmin && departmentFilter) {
            departmentFilter.value = 'all';
        }
        loadTasks();
    });
    
    // Sort tasks
    sortOptions.forEach(option => {
        option.addEventListener('click', function() {
            const sortBy = this.getAttribute('data-sort');
            
            if (currentSort === sortBy) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort = sortBy;
                currentSortDirection = 'asc';
            }
            
            displayTasks(currentTasks);
        });
    });
    
    // Load tasks function
    function loadTasks() {
        showLoading();
        
        const status = statusFilter.value;
        const priority = priorityFilter.value;
        const searchQuery = searchFilter.value;
        
        let url = `/api/tasks?status=${status}&priority=${priority}`;
        
        if (searchQuery) {
            url += `&q=${encodeURIComponent(searchQuery)}`;
        }
        
        if (isAdmin && departmentFilter && departmentFilter.value !== 'all') {
            url += `&department=${encodeURIComponent(departmentFilter.value)}`;
        }
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                currentTasks = data;
                displayTasks(data);
            })
            .catch(error => {
                console.error('Error loading tasks:', error);
                hideLoading();
                showToast('Failed to load tasks. Please try again later.', 'danger');
            });
    }
    
    // Display tasks
    function displayTasks(tasks) {
        hideLoading();
        
        // Sort tasks
        tasks = sortTasks(tasks, currentSort, currentSortDirection);
        
        if (tasks.length === 0) {
            tasksList.innerHTML = '';
            emptyState.style.display = 'block';
            noResultsFound.style.display = 'none';
            taskPagination.innerHTML = '';
            
            // Check if there are filters applied
            if (statusFilter.value !== 'all' || priorityFilter.value !== 'all' || searchFilter.value !== '') {
                emptyState.style.display = 'none';
                noResultsFound.style.display = 'block';
            }
            
            return;
        }
        
        // Hide empty states
        emptyState.style.display = 'none';
        noResultsFound.style.display = 'none';
        
        // Paginate tasks
        const totalPages = Math.ceil(tasks.length / tasksPerPage);
        if (currentPage > totalPages) {
            currentPage = 1;
        }
        
        const startIndex = (currentPage - 1) * tasksPerPage;
        const endIndex = startIndex + tasksPerPage;
        const paginatedTasks = tasks.slice(startIndex, endIndex);
        
        // Build task list
        let html = '';
        
        paginatedTasks.forEach(task => {
            const isOverdue = task.is_overdue ? 'overdue' : task.status;
            
            html += `
            <li class="task-item" data-task-id="${task.id}">
                <div class="task-title" data-bs-toggle="modal" data-bs-target="${isAdmin ? '#editTaskModal' : '#viewTaskModal'}">${task.title}</div>
                <div class="task-meta">
                    <div class="task-meta-item">
                        <i class="far fa-calendar-alt"></i> ${formatDate(task.due_date)}
                    </div>
                    <div class="task-meta-item">
                        <i class="far fa-user"></i> ${task.assignee_name || 'Unassigned'}
                    </div>
                    <div class="task-meta-item">
                        <span class="task-priority ${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                    </div>
                    <div class="task-meta-item">
                        <span class="task-status ${isOverdue}">${isOverdue.charAt(0).toUpperCase() + isOverdue.slice(1)}</span>
                    </div>
                </div>
                ${!isAdmin ? `
                <div class="task-actions">
                    <button class="btn btn-sm btn-success complete-task-btn" data-task-id="${task.id}" ${task.status === 'completed' ? 'disabled' : ''}>
                        <i class="fas fa-check me-1"></i> ${task.status === 'completed' ? 'Completed' : 'Mark Complete'}
                    </button>
                </div>
                ` : ''}
            </li>
            `;
        });
        
        tasksList.innerHTML = html;
        
        // Generate pagination
        generatePagination(totalPages);
        
        // Add event listeners to task items
        document.querySelectorAll('.task-item').forEach(item => {
            item.querySelector('.task-title').addEventListener('click', function() {
                const taskId = item.getAttribute('data-task-id');
                const task = tasks.find(t => t.id == taskId);
                
                if (task) {
                    if (isAdmin) {
                        openEditTaskModal(task);
                    } else {
                        openViewTaskModal(task);
                    }
                }
            });
        });
        
        // Add event listeners to complete buttons (non-admin users)
        if (!isAdmin) {
            document.querySelectorAll('.complete-task-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const taskId = this.getAttribute('data-task-id');
                    markTaskAsCompleted(taskId);
                });
            });
        }
    }
    
    // Generate pagination controls
    function generatePagination(totalPages) {
        if (totalPages <= 1) {
            taskPagination.innerHTML = '';
            return;
        }
        
        let paginationHtml = `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `;
        
        // Show a limited number of pages for better UI
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        paginationHtml += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `;
        
        taskPagination.innerHTML = paginationHtml;
        
        // Add event listeners to pagination links
        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = parseInt(this.getAttribute('data-page'));
                if (page >= 1 && page <= totalPages) {
                    currentPage = page;
                    displayTasks(currentTasks);
                }
            });
        });
    }
    
    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }
    
    // Sort tasks
    function sortTasks(tasks, sortBy, direction) {
        return [...tasks].sort((a, b) => {
            let valueA, valueB;
            
            if (sortBy === 'due_date') {
                valueA = new Date(a.due_date);
                valueB = new Date(b.due_date);
            } else if (sortBy === 'priority') {
                const priorityMap = { 'low': 1, 'medium': 2, 'high': 3 };
                valueA = priorityMap[a.priority];
                valueB = priorityMap[b.priority];
            } else {
                valueA = a[sortBy]?.toLowerCase?.() || '';
                valueB = b[sortBy]?.toLowerCase?.() || '';
            }
            
            if (direction === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
    }
    
    // Show loading spinner
    function showLoading() {
        loadingSpinner.style.display = 'flex';
        tasksList.style.display = 'none';
    }
    
    // Hide loading spinner
    function hideLoading() {
        loadingSpinner.style.display = 'none';
        tasksList.style.display = 'block';
    }
    
    // ========== ADMIN FUNCTIONS ==========
    if (isAdmin) {
        // Load users for task assignment
        function loadUsers() {
            fetch('/api/users')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(users => {
                    populateUserDropdowns(users);
                })
                .catch(error => {
                    console.error('Error loading users:', error);
                    showToast('Failed to load users. Please refresh the page.', 'danger');
                });
        }
        
        // Populate user dropdowns
        function populateUserDropdowns(users) {
            const taskAssignee = document.getElementById('taskAssignee');
            const editTaskAssignee = document.getElementById('editTaskAssignee');
            
            if (!taskAssignee || !editTaskAssignee) return;
            
            let html = '<option value="">Select Assignee</option>';
            
            users.forEach(user => {
                if (user.is_active) {
                    html += `<option value="${user.id}">${user.full_name || user.username} (${user.department || 'No department'})</option>`;
                }
            });
            
            taskAssignee.innerHTML = html;
            editTaskAssignee.innerHTML = html;
        }
        
        // Add task event listener
        const saveTaskBtn = document.getElementById('saveTaskBtn');
        if (saveTaskBtn) {
            saveTaskBtn.addEventListener('click', function() {
                const title = document.getElementById('taskTitle').value;
                const description = document.getElementById('taskDescription').value;
                const dueDate = document.getElementById('taskDueDate').value;
                const priority = document.getElementById('taskPriority').value;
                const assigneeId = document.getElementById('taskAssignee').value;
                
                if (!title || !dueDate || !assigneeId) {
                    showToast('Please fill in all required fields.', 'warning');
                    return;
                }
                
                const taskData = {
                    title: title,
                    description: description,
                    due_date: dueDate,
                    priority: priority,
                    assignee_id: assigneeId
                };
                
                fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(taskData)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to create task');
                    }
                    return response.json();
                })
                .then(data => {
                    // Reset form and close modal
                    document.getElementById('addTaskForm').reset();
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
                    modal.hide();
                    
                    // Reload tasks
                    loadTasks();
                    
                    // Show success message
                    showToast('Task created successfully!', 'success');
                })
                .catch(error => {
                    console.error('Error creating task:', error);
                    showToast('Failed to create task. Please try again.', 'danger');
                });
            });
        }
        
        // Open edit task modal
        function openEditTaskModal(task) {
            const editTaskId = document.getElementById('editTaskId');
            const editTaskTitle = document.getElementById('editTaskTitle');
            const editTaskDescription = document.getElementById('editTaskDescription');
            const editTaskDueDate = document.getElementById('editTaskDueDate');
            const editTaskPriority = document.getElementById('editTaskPriority');
            const editTaskAssignee = document.getElementById('editTaskAssignee');
            const editTaskStatus = document.getElementById('editTaskStatus');
            const deleteTaskBtn = document.getElementById('deleteTaskBtn');
            
            // Populate form fields
            editTaskId.value = task.id;
            editTaskTitle.value = task.title;
            editTaskDescription.value = task.description || '';
            editTaskDueDate.value = task.due_date;
            editTaskPriority.value = task.priority;
            editTaskAssignee.value = task.assignee_id || '';
            editTaskStatus.value = task.status;
            
            // Setup delete button
            deleteTaskBtn.setAttribute('data-task-id', task.id);
        }
        
        // Update task event listener
        const updateTaskBtn = document.getElementById('updateTaskBtn');
        if (updateTaskBtn) {
            updateTaskBtn.addEventListener('click', function() {
                const taskId = document.getElementById('editTaskId').value;
                const title = document.getElementById('editTaskTitle').value;
                const description = document.getElementById('editTaskDescription').value;
                const dueDate = document.getElementById('editTaskDueDate').value;
                const priority = document.getElementById('editTaskPriority').value;
                const assigneeId = document.getElementById('editTaskAssignee').value;
                const status = document.getElementById('editTaskStatus').value;
                
                if (!title || !dueDate || !assigneeId || !status) {
                    showToast('Please fill in all required fields.', 'warning');
                    return;
                }
                
                const taskData = {
                    title: title,
                    description: description,
                    due_date: dueDate,
                    priority: priority,
                    assignee_id: assigneeId,
                    status: status
                };
                
                fetch(`/api/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(taskData)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to update task');
                    }
                    return response.json();
                })
                .then(data => {
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
                    modal.hide();
                    
                    // Reload tasks
                    loadTasks();
                    
                    // Show success message
                    showToast('Task updated successfully!', 'success');
                })
                .catch(error => {
                    console.error('Error updating task:', error);
                    showToast('Failed to update task. Please try again.', 'danger');
                });
            });
        }
        
        // Delete task button
        const deleteTaskBtn = document.getElementById('deleteTaskBtn');
        if (deleteTaskBtn) {
            deleteTaskBtn.addEventListener('click', function() {
                const taskId = this.getAttribute('data-task-id');
                const taskTitle = document.getElementById('editTaskTitle').value;
                
                // Set task name in confirmation modal
                document.getElementById('deleteTaskName').textContent = taskTitle;
                
                // Close edit modal
                const editModal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
                editModal.hide();
                
                // Show confirmation modal
                const confirmModal = new bootstrap.Modal(document.getElementById('deleteTaskConfirmModal'));
                confirmModal.show();
                
                // Set task ID for confirmation button
                document.getElementById('confirmDeleteTaskBtn').setAttribute('data-task-id', taskId);
            });
        }
        
        // Confirm delete task
        const confirmDeleteTaskBtn = document.getElementById('confirmDeleteTaskBtn');
        if (confirmDeleteTaskBtn) {
            confirmDeleteTaskBtn.addEventListener('click', function() {
                const taskId = this.getAttribute('data-task-id');
                
                fetch(`/api/tasks/${taskId}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to delete task');
                    }
                    return response.json();
                })
                .then(data => {
                    // Close confirmation modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteTaskConfirmModal'));
                    modal.hide();
                    
                    // Reload tasks
                    loadTasks();
                    
                    // Show success message
                    showToast('Task deleted successfully!', 'success');
                })
                .catch(error => {
                    console.error('Error deleting task:', error);
                    showToast('Failed to delete task. Please try again.', 'danger');
                });
            });
        }
    } 
    // ========== END ADMIN FUNCTIONS ==========
    
    // ========== USER (NON-ADMIN) FUNCTIONS ==========
    else {
        // Open view task modal
        function openViewTaskModal(task) {
            const viewTaskTitle = document.getElementById('viewTaskTitle');
            const viewTaskDescription = document.getElementById('viewTaskDescription');
            const viewTaskDueDate = document.getElementById('viewTaskDueDate');
            const viewTaskCreator = document.getElementById('viewTaskCreator');
            const viewTaskPriority = document.getElementById('viewTaskPriority');
            const viewTaskStatus = document.getElementById('viewTaskStatus');
            const markTaskCompleted = document.getElementById('markTaskCompleted');
            const saveTaskStatusBtn = document.getElementById('saveTaskStatusBtn');
            
            // Set task details
            viewTaskTitle.textContent = task.title;
            viewTaskDescription.textContent = task.description || 'No description provided';
            viewTaskDueDate.textContent = formatDate(task.due_date);
            viewTaskCreator.textContent = task.creator_name || 'Administrator';
            
            // Set priority badge
            viewTaskPriority.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
            viewTaskPriority.className = `task-priority ${task.priority}`;
            
            // Set status badge
            const isOverdue = task.is_overdue ? 'overdue' : task.status;
            viewTaskStatus.textContent = isOverdue.charAt(0).toUpperCase() + isOverdue.slice(1);
            viewTaskStatus.className = `task-status ${isOverdue}`;
            
            // Set completion checkbox
            if (task.status === 'completed') {
                markTaskCompleted.checked = true;
                markTaskCompleted.disabled = true;
                saveTaskStatusBtn.disabled = true;
            } else {
                markTaskCompleted.checked = false;
                markTaskCompleted.disabled = false;
                saveTaskStatusBtn.disabled = false;
            }
            
            // Set task ID for save button
            saveTaskStatusBtn.setAttribute('data-task-id', task.id);
        }
        
        // Save task status
        const saveTaskStatusBtn = document.getElementById('saveTaskStatusBtn');
        if (saveTaskStatusBtn) {
            saveTaskStatusBtn.addEventListener('click', function() {
                const taskId = this.getAttribute('data-task-id');
                const isCompleted = document.getElementById('markTaskCompleted').checked;
                
                if (isCompleted) {
                    markTaskAsCompleted(taskId, true);
                }
            });
        }
        
        // Mark task as completed
        function markTaskAsCompleted(taskId, closeViewModal = false) {
            fetch(`/api/tasks/${taskId}/complete`, {
                method: 'POST'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update task status');
                }
                return response.json();
            })
            .then(data => {
                // Close view modal if open
                if (closeViewModal) {
                    const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewTaskModal'));
                    viewModal.hide();
                }
                
                // Show completion modal
                const completionModal = new bootstrap.Modal(document.getElementById('completionModal'));
                completionModal.show();
                
                // Reload tasks after modal is closed
                document.getElementById('completionModal').addEventListener('hidden.bs.modal', function() {
                    loadTasks();
                }, { once: true });
            })
            .catch(error => {
                console.error('Error updating task status:', error);
                showToast('Failed to mark task as completed. Please try again.', 'danger');
            });
        }
    }
    // ========== END USER FUNCTIONS ==========
    
    // Toast notification function
    function showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('id', toastId);
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close">
                </button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Initialize and show toast
        const bsToast = new bootstrap.Toast(toast, {
            delay: 3000
        });
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', function() {
            this.remove();
        });
    }
});