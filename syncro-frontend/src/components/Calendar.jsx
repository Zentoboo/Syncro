import React, { useState, useEffect } from 'react';

const Calendar = ({ selectedProject, projectTasks = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('Month');

    // Debug Log
    console.log('Calendar component received projectTasks:', projectTasks);

    // Get all dates in the current month
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add the date from the previous month (shown in gray)
        const prevMonth = new Date(year, month - 1, 0);
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            days.push({
                date: prevMonth.getDate() - i,
                isCurrentMonth: false,
                fullDate: new Date(year, month - 1, prevMonth.getDate() - i)
            });
        }

        // Add the day of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push({
                date: day,
                isCurrentMonth: true,
                fullDate: new Date(year, month, day)
            });
        }

        // Add next month's date (grayed out)
        const remainingDays = 42 - days.length; // 6行 × 7列 = 42个格子
        for (let day = 1; day <= remainingDays; day++) {
            days.push({
                date: day,
                isCurrentMonth: false,
                fullDate: new Date(year, month + 1, day)
            });
        }

        return days;
    };

    // Navigate to previous month
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    // Navigate to next month
    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Navigate to today
    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Get the date of the current week
    const getWeekDays = (date) => {
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - day); // 设置为周日

        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + i);
            weekDays.push({
                date: currentDay.getDate(),
                fullDate: new Date(currentDay),
                isCurrentMonth: currentDay.getMonth() === date.getMonth()
            });
        }
        return weekDays;
    };

    // Get the tasks for the day (for Day view)
    const getDayTasks = (date) => {
        return getTasksForDate(date);
    };

    // Check if it is today
    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    // Get the tasks for a specified date
    const getTasksForDate = (date) => {
        const tasksForDate = projectTasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate.toDateString() === date.toDateString();
        });

        // Debug Log
        if (tasksForDate.length > 0) {
            console.log(`Found ${tasksForDate.length} tasks for date ${date.toDateString()}:`, tasksForDate);
        }

        return tasksForDate;
    };

    // Get the task priority color
    const getPriorityColor = (priority) => {
        // priority是数字：Low=0, Medium=1, High=2, Critical=3
        switch (priority) {
            case 3: return 'bg-purple-500'; // Critical
            case 2: return 'bg-red-500';    // High
            case 1: return 'bg-yellow-500'; // Medium
            case 0: return 'bg-green-500';  // Low
            default: return 'bg-gray-500';
        }
    };

    const getPriorityColorHex = (priority) => {
        switch (priority) {
            case 3: return '#8b5cf6'; // purple-500
            case 2: return '#ef4444'; // red-500
            case 1: return '#eab308'; // yellow-500
            case 0: return '#22c55e'; // green-500
            default: return '#6b7280'; // gray-500
        }
    };

    const days = getDaysInMonth(currentDate);
    const weekDays = getWeekDays(currentDate);
    const dayTasks = getDayTasks(currentDate);
    const monthNames = [
        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];
    const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={goToPreviousMonth}
                        className="p-2 hover:bg-gray-100 rounded-md"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={goToNextMonth}
                        className="p-2 hover:bg-gray-100 rounded-md"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                    >
                        Today
                    </button>
                </div>

                <h2 className="text-xl font-bold text-gray-800">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>

                <div className="flex space-x-1">
                    {['Month', 'Week', 'Day', 'List'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-3 py-1 text-sm rounded-md ${
                                viewMode === mode
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rendering different views */}
            {viewMode === 'Month' && (
                <>
                    {/* Weekly Title */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekDayNames.map((day) => (
                            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Month View Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => {
                            const dayTasks = getTasksForDate(day.fullDate);
                            const isCurrentDay = isToday(day.fullDate);

                            return (
                                <div
                                    key={index}
                                    className={`
                                        min-h-[80px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50
                                        ${!day.isCurrentMonth ? 'bg-gray-100 text-gray-400' : 'bg-white'}
                                        ${isCurrentDay ? 'bg-blue-100 border-blue-500' : ''}
                                    `}
                                >
                                    <div className={`text-sm font-medium ${isCurrentDay ? 'text-blue-700' : ''}`}>
                                        {day.date}
                                    </div>

                                    {/* Task Indicator */}
                                    <div className="mt-1 space-y-1">
                                        {dayTasks.slice(0, 3).map((task, taskIndex) => (
                                            <div
                                                key={taskIndex}
                                                className={`text-xs px-1 py-0.5 rounded text-white truncate ${getPriorityColor(task.priority)}`}
                                                                title={`${task.title}\nDue Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US') : 'None'}\nPriority: ${['Low', 'Medium', 'High', 'Critical'][task.priority]}`}
                                            >
                                                {task.title}
                                            </div>
                                        ))}
                                        {dayTasks.length > 3 && (
                                            <div className="text-xs text-gray-500">
                                                +{dayTasks.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Weekly View */}
            {viewMode === 'Week' && (
                <>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekDayNames.map((day) => (
                            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {weekDays.map((day, index) => {
                            const dayTasks = getTasksForDate(day.fullDate);
                            const isCurrentDay = isToday(day.fullDate);

                            return (
                                <div
                                    key={index}
                                    className={`
                                        min-h-[120px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50
                                        ${!day.isCurrentMonth ? 'bg-gray-100 text-gray-400' : 'bg-white'}
                                        ${isCurrentDay ? 'bg-blue-100 border-blue-500' : ''}
                                    `}
                                >
                                    <div className={`text-sm font-medium ${isCurrentDay ? 'text-blue-700' : ''}`}>
                                        {day.date}
                                    </div>

                                    <div className="mt-1 space-y-1">
                                        {dayTasks.map((task, taskIndex) => (
                                            <div
                                                key={taskIndex}
                                                className={`text-xs px-1 py-0.5 rounded text-white truncate ${getPriorityColor(task.priority)}`}
                                                title={`${task.title}\nDue Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US') : 'None'}\nPriority: ${['Low', 'Medium', 'High', 'Critical'][task.priority]}`}
                                            >
                                                {task.title}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Day View */}
            {viewMode === 'Day' && (
                <div className="space-y-4">
                    <div className="text-center text-lg font-semibold">
                        {currentDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long'
                        })}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        {dayTasks.length > 0 ? (
                            <div className="space-y-2">
                                {dayTasks.map((task, index) => (
                                    <div key={index} className="bg-white p-3 rounded border-l-4"
                                         style={{borderLeftColor: getPriorityColorHex(task.priority)}}>
                                        <div className="font-medium">{task.title}</div>
                                        <div className="text-sm text-gray-600">{task.description}</div>
                                        <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                            <span>Priority: {['Low', 'Medium', 'High', 'Critical'][task.priority]}</span>
                                            {task.dueDate && (
                                                <span>Due: {new Date(task.dueDate).toLocaleDateString('en-US')}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500">No tasks for today</div>
                        )}
                    </div>
                </div>
            )}

            {/* List View */}
            {viewMode === 'List' && (
                <div className="space-y-4">
                    <div className="text-lg font-semibold">All Tasks</div>
                    {projectTasks.length > 0 ? (
                        <div className="space-y-2">
                            {projectTasks
                                .filter(task => task.dueDate)
                                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                                .map((task, index) => (
                                <div key={index} className="bg-white p-3 rounded border-l-4"
                                     style={{borderLeftColor: getPriorityColorHex(task.priority)}}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium">{task.title}</div>
                                            <div className="text-sm text-gray-600">{task.description}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Priority: {['Low', 'Medium', 'High', 'Critical'][task.priority]} |
                                                Status: {['To Do', 'In Progress', 'In Review', 'Done'][task.status]}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(task.dueDate).toLocaleDateString('en-US')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500">No tasks</div>
                    )}
                </div>
            )}

            {/* Project Information */}
            {selectedProject && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-600">
                        Showing Project: <span className="font-medium text-gray-800">{selectedProject.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {projectTasks.length} tasks total
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
