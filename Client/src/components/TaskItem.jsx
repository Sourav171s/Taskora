import React, { useEffect, useState, useCallback } from 'react'
import { TI_CLASSES, getPriorityColor, MENU_OPTIONS, getPriorityBadgeColor } from '../assets/dummy'
import axios from 'axios'
const API_BASE = 'http://localhost:4000/api/tasks'
import { MoreVertical, CheckCircle2, Calendar, Clock } from 'lucide-react'
import { isToday } from 'date-fns'
import { format } from 'date-fns'
import TaskModal from './TaskModal'
const TaskItem = ({ task, onRefresh, onLogout, showCompleteCheckbox = true }) => {

    const [showMenu, setShowMenu] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)

    // Normalize completed status
    const isTaskCompleted = useCallback(() => {
        return [true, 1, 'yes'].includes(
            typeof task.completed === 'string'
                ? task.completed.toLowerCase()
                : task.completed
        )
    }, [task.completed])

    const [isCompleted, setIsCompleted] = useState(isTaskCompleted())

    useEffect(() => {
        setIsCompleted(isTaskCompleted())
    }, [isTaskCompleted])




    const getAuthHeaders = () => {
        const token = localStorage.getItem('token')
        if (!token) throw new Error("No")
        return { Authorization: `Bearer ${token}` }
    }

    const borderColor = isCompleted ? "border-green-500" : getPriorityColor(task.priority).split(" ")[0]



    const handleComplete = async () => {
        const newStatus = isCompleted ? 'No' : 'Yes'

        try {
            await axios.put(
                `${API_BASE}/${task._id}/gp`,
                { completed: newStatus },
                { headers: getAuthHeaders() }
            )

            setIsCompleted(!isCompleted)
            onRefresh?.()
        } catch (err) {
            console.error(err)
            if (err.response?.status === 401) onLogout?.()
        }
    }



    const handleAction = (action) => {
        setShowMenu(false)
        if (action === 'edit') setShowEditModal(true)
        if (action === 'delete') handleDelete()
    }

    const handleDelete = async () => {
        try {
            await axios.delete(`${API_BASE}/${task._id}/gp`, { headers: getAuthHeaders() })
            onRefresh?.()
        } catch (error) {
            if (error.response?.status === 401) onLogout?.()
        }
    }

    const handleSave = () => {
        setShowEditModal(false)
        onRefresh?.()
    }


    return (
        <>
            <div className={`${TI_CLASSES.wrapper} ${borderColor}`}>
                <div className={TI_CLASSES.leftContainer}>
                    {showCompleteCheckbox && (
                        <button
                            onClick={handleComplete}
                            className={`${TI_CLASSES.completeBtn} ${isCompleted ? 'text-green-500' : 'text-gray-300'
                                }`}
                        >
                            <CheckCircle2
                                size={18}
                                className={`${TI_CLASSES.checkboxIconBase} ${isCompleted ? 'fill-green-500' : ''
                                    }`}
                            />
                        </button>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                            <h3
                                className={`${TI_CLASSES.titleBase} ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'
                                    }`}
                            >
                                {task.title}
                            </h3>

                            <span
                                className={`${TI_CLASSES.priorityBadge} ${getPriorityBadgeColor(
                                    task.priority
                                )}`}
                            >
                                {task.priority}
                            </span>
                        </div>

                        {task.description && (
                            <p className={TI_CLASSES.description}>{task.description}</p>
                        )}
                    </div>
                </div>
                <div className={`${TI_CLASSES.rightContainer} flex-shrink-0`}>
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={TI_CLASSES.menuButton}
                        >
                            <MoreVertical
                                className="w-4 h-4 sm:w-5 sm:h-5"
                                size={18}
                            />
                        </button>

                        {showMenu && (
                            <div className={TI_CLASSES.menuDropdown}>
                                {MENU_OPTIONS.map(opt => (
                                    <button
                                        key={opt.action}
                                        onClick={() => handleAction(opt.action)}
                                        className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-purple-50 flex items-center gap-2 transition-colors duration-200"
                                    >
                                        {opt.icon}{opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-0.5 text-xs">
                        <div className={`${TI_CLASSES.dateRow} inline-flex items-center gap-1 leading-tight ${task.dueDate && !isNaN(new Date(task.dueDate)) && isToday(new Date(task.dueDate))
                            ? 'text-fuchsia-600' : 'text-gray-500'}`}>
                            <Calendar className='w-3 h-3 block' />
                            {task.dueDate && !isNaN(new Date(task.dueDate)) ? (isToday(new Date(task.dueDate)) ?
                                'Today' : format(new Date(task.dueDate), 'MMM dd')) : '-'}

                        </div>

                        <div className={`${TI_CLASSES.createRow} inline-flex items-center gap-1 leading-tight text-gray-400`}>
                            <Clock className='w-3 h-3 block' />
                            {task.createdAt && !isNaN(new Date(task.createdAt)) ?
                                `Created ${format(new Date(task.createdAt), 'MMM dd')}` : 'No date'}
                        </div>
                    </div>
                </div>
            </div>

            <TaskModal isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                taskToEdit={task}
                onSave={handleSave} />
        </>
    )
}

export default TaskItem
