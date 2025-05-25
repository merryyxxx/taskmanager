document.addEventListener('DOMContentLoaded', function() {
    // Calendar state
    let currentDate = new Date();
    let tasks = []; // Will be populated from API/database
    let events = []; // Will be populated from API/database
    
    // Cache DOM elements
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearLabel = document.getElementById('monthYearLabel');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const todayBtn = document.getElementById('todayBtn');
    
    // Month and day names
    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Initialize
    initCalendar();

    // Event listeners
    prevMonthBtn.addEventListener('click', navigateToPreviousMonth);
    nextMonthBtn.addEventListener('click', navigateToNextMonth);
    todayBtn.addEventListener('click', navigateToToday);
    
    // Admin event handlers
    const saveEventBtn = document.getElementById('saveEventBtn');
    if (saveEventBtn) {
        saveEventBtn.addEventListener('click', saveEvent);
    }

    /**
     * Initialize the calendar
     */
    function initCalendar() {
        // Fetch calendar data first
        fetchCalendarData().then(() => {
            renderCalendar();
        });
    }

    /**
     * Fetch calendar data from API/database
     * @returns {Promise} Promise that resolves when data is fetched
     */
    function fetchCalendarData() {
        // This would be replaced with actual API calls in production
        return Promise.all([
            fetchTasks(),
            fetchEvents()
        ]);
    }

    /**
     * Fetch tasks from API/database
     * @returns {Promise} Promise that resolves when tasks are fetched
     */
    function fetchTasks() {
        // This is a placeholder. In a real app, you'd fetch from your API
        return new Promise((resolve) => {
            // Simulate API call with some dummy data
            setTimeout(() => {
                tasks = [
                    {
                        id: 1,
                        title: 'Complete project proposal',
                        description: 'Finish the draft and send for review',
                        due_date: formatDateString(new Date(currentDate.getFullYear(), currentDate.getMonth(), 15)),
                        assignee_name: 'John Doe',
                        priority: 'high',
                        status: 'pending'
                    },
                    {
                        id: 2,
                        title: 'Team meeting',
                        description: 'Weekly progress update',
                        due_date: formatDateString(new Date(currentDate.getFullYear(), currentDate.getMonth(), 10)),
                        assignee_name: 'Jane Smith',
                        priority: 'medium',
                        status: 'pending'
                    },
                    {
                        id: 3,
                        title: 'Review code changes',
                        description: 'Check pull requests and provide feedback',
                        due_date: formatDateString(new Date(currentDate.getFullYear(), currentDate.getMonth(), 5)),
                        assignee_name: 'Mike Johnson',
                        priority: 'low',
                        status: 'completed'
                    }
                ];
                resolve();
            }, 300);
        });
    }

    /**
     * Fetch events from API/database
     * @returns {Promise} Promise that resolves when events are fetched
     */
    function fetchEvents() {
        // This is a placeholder. In a real app, you'd fetch from your API
        return new Promise((resolve) => {
            // Simulate API call with some dummy data
            setTimeout(() => {
                events = [
                    {
                        id: 1,
                        title: 'Company Meeting',
                        description: 'Annual company-wide meeting',
                        date: formatDateString(new Date(currentDate.getFullYear(), currentDate.getMonth(), 20)),
                        category: 'meeting'
                    },
                    {
                        id: 2,
                        title: 'Project Deadline',
                        description: 'Final submission deadline for Q2 project',
                        date: formatDateString(new Date(currentDate.getFullYear(), currentDate.getMonth(), 28)),
                        category: 'deadline'
                    },
                    {
                        id: 3,
                        title: 'Company Holiday',
                        description: 'Office closed for holiday',
                        date: formatDateString(new Date(currentDate.getFullYear(), currentDate.getMonth(), 25)),
                        category: 'holiday'
                    }
                ];
                resolve();
            }, 300);
        });
    }

    /**
     * Format date as YYYY-MM-DD string
     * @param {Date} date The date to format
     * @returns {string} The formatted date string
     */
    function formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Render the calendar for the current month
     */
    function renderCalendar() {
        if (!calendarGrid) return;

        // Update month and year display
        monthYearLabel.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

        // Clear previous calendar days
        calendarGrid.innerHTML = '';

        // Add day headers
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        // Get first day of month and total days
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const totalDays = lastDay.getDate();
        const startDayIndex = firstDay.getDay(); // 0-6 (Sunday-Saturday)
        
        // Get current date for highlighting
        const today = new Date();
        
        // Get days from previous month to fill first row
        const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
        for (let i = 0; i < startDayIndex; i++) {
            const prevDay = prevMonthLastDay - startDayIndex + i + 1;
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day disabled outside-month';
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = prevDay;
            
            const dayContent = document.createElement('div');
            dayContent.className = 'calendar-day-content';
            
            dayElement.appendChild(dayNumber);
            dayElement.appendChild(dayContent);
            calendarGrid.appendChild(dayElement);
        }
        
        // Add current month days
        for (let day = 1; day <= totalDays; day++) {
            const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = isSameDay(currentDayDate, today);
            
            const dayElement = document.createElement('div');
            dayElement.className = isToday ? 'calendar-day current-day' : 'calendar-day';
            
            // Set data attribute for date
            const dateString = formatDateString(currentDayDate);
            dayElement.dataset.date = dateString;
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = day;
            
            const dayContent = document.createElement('div');
            dayContent.className = 'calendar-day-content';
            dayContent.id = `day-${day}`;
            
            // Add tasks for this day
            const dayTasks = getTasksForDate(currentDayDate);
            dayTasks.forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.className = `task-item ${task.priority}`;
                taskItem.textContent = task.title;
                taskItem.dataset.taskId = task.id;
                
                taskItem.addEventListener('click', function(e) {
                    e.stopPropagation();
                    showTaskDetails(task);
                });
                
                dayContent.appendChild(taskItem);
            });
            
            // Add events for this day
            const dayEvents = getEventsForDate(currentDayDate);
            dayEvents.forEach(event => {
                const eventItem = document.createElement('div');
                eventItem.className = `event-item ${event.category}`;
                eventItem.textContent = event.title;
                eventItem.dataset.eventId = event.id;
                
                eventItem.addEventListener('click', function(e) {
                    e.stopPropagation();
                    showEventDetails(event);
                });
                
                dayContent.appendChild(eventItem);
            });
            
            dayElement.appendChild(dayNumber);
            dayElement.appendChild(dayContent);
            calendarGrid.appendChild(dayElement);
        }
        
        // Fill remaining cells with next month days
        const totalCells = 42; // 6 rows x 7 days
        const remainingCells = totalCells - (startDayIndex + totalDays);
        for (let i = 1; i <= remainingCells; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day disabled outside-month';
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = i;
            
            const dayContent = document.createElement('div');
            dayContent.className = 'calendar-day-content';
            
            dayElement.appendChild(dayNumber);
            dayElement.appendChild(dayContent);
            calendarGrid.appendChild(dayElement);
        }
    }

    /**
     * Get tasks for a specific date
     * @param {Date} date The date to get tasks for
     * @returns {Array} The tasks for this date
     */
    function getTasksForDate(date) {
        return tasks.filter(task => {
            const taskDate = new Date(task.due_date);
            return isSameDay(taskDate, date);
        });
    }

    /**
     * Get events for a specific date
     * @param {Date} date The date to get events for
     * @returns {Array} The events for this date
     */
    function getEventsForDate(date) {
        return events.filter(event => {
            const eventDate = new Date(event.date);
            return isSameDay(eventDate, date);
        });
    }

    /**
     * Check if two dates are the same day
     * @param {Date} date1 The first date
     * @param {Date} date2 The second date
     * @returns {boolean} Whether the dates are the same day
     */
    function isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() && 
               date1.getMonth() === date2.getMonth() && 
               date1.getFullYear() === date2.getFullYear();
    }

    /**
     * Navigate to the previous month
     */
    function navigateToPreviousMonth() {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        fetchCalendarData().then(() => {
            renderCalendar();
        });
    }

    /**
     * Navigate to the next month
     */
    function navigateToNextMonth() {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        fetchCalendarData().then(() => {
            renderCalendar();
        });
    }

    /**
     * Navigate to today
     */
    function navigateToToday() {
        currentDate = new Date();
        fetchCalendarData().then(() => {
            renderCalendar();
        });
    }

    /**
     * Show task details in modal
     * @param {Object} task The task to show details for
     */
    function showTaskDetails(task) {
        const taskDetailModal = document.getElementById('taskDetailModal');
        if (!taskDetailModal) return;
        
        // Set task details in modal
        document.getElementById('taskDetailModalLabel').textContent = task.title;
        document.getElementById('taskStatus').textContent = capitalizeFirstLetter(task.status);
        document.getElementById('taskStatus').className = `task-status ${task.status}`;
        document.getElementById('taskPriority').textContent = `${capitalizeFirstLetter(task.priority)} Priority`;
        document.getElementById('taskDescription').textContent = task.description || 'No description provided';
        document.getElementById('taskDueDate').textContent = task.due_date;
        document.getElementById('taskAssignee').textContent = task.assignee_name;
        
        // Set modal priority class
        document.querySelector('.modal-task-detail').className = `modal-dialog modal-task-detail ${task.priority}`;
        
        // Show modal using Bootstrap
        const bsModal = new bootstrap.Modal(taskDetailModal);
        bsModal.show();
    }

    /**
     * Show event details in modal
     * @param {Object} event The event to show details for
     */
    function showEventDetails(event) {
        const eventDetailModal = document.getElementById('eventDetailModal');
        if (!eventDetailModal) return;
        
        // Set event details in modal
        document.getElementById('eventDetailModalLabel').textContent = event.title;
        document.getElementById('eventDescription').textContent = event.description || 'No description provided';
        document.getElementById('eventDate').textContent = event.date;
        document.getElementById('eventCategory').textContent = capitalizeFirstLetter(event.category);
        
        // Show modal using Bootstrap
        const bsModal = new bootstrap.Modal(eventDetailModal);
        bsModal.show();
    }

    /**
     * Save a new event (admin only)
     */
    function saveEvent() {
        const title = document.getElementById('eventTitle').value.trim();
        const description = document.getElementById('eventDescription').value.trim();
        const date = document.getElementById('eventDate').value;
        const category = document.getElementById('eventCategory').value;
        
        if (!title || !date) {
            alert('Please enter a title and date for the event.');
            return;
        }
        
        // In a real app, this would be an API call
        // Simulate API call and success
        const newEvent = {
            id: events.length + 1,
            title: title,
            description: description,
            date: date,
            category: category
        };
        
        events.push(newEvent);
        
        // Close modal using Bootstrap
        const eventModal = document.getElementById('addEventModal');
        const bsModal = bootstrap.Modal.getInstance(eventModal);
        bsModal.hide();
        
        // Reset form
        document.getElementById('addEventForm').reset();
        
        // Refresh calendar
        renderCalendar();
        
        // Show success message
        alert('Event created successfully!');
    }

    /**
     * Capitalize the first letter of a string
     * @param {string} string The string to capitalize
     * @returns {string} The capitalized string
     */
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
});