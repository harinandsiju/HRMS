const mongoose = require("mongoose");

const Task = require("../models/Task");
const Employee = require("../models/Employee");
const User = require("../models/User");
const logActivity = require("../helpers/activityLogger");


// Create Task
const createTask = async (req, res) => {
    try {
        const {
            employeeId,
            title,
            description,
            priority,
            dueDate
        } = req.body;


        // 1. Validate required fields
        if (
            !employeeId ||
            !title ||
            !dueDate
        ) {
            return res.status(400).json({
                message: "Employee, title and due date are required"
            });
        }


        // 2. Validate employee ID
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({
                message: "Invalid employee ID"
            });
        }


        // 3. Check employee
        const employee = await Employee.findOne({
            _id: employeeId,
            isDeleted: false,
            isActive: true
        });

        if (!employee) {
            return res.status(404).json({
                message: "Active employee not found"
            });
        }


        // 4. Validate priority
        const validPriorities = [
            "Low",
            "Medium",
            "High"
        ];

        if (
            priority &&
            !validPriorities.includes(priority)
        ) {
            return res.status(400).json({
                message: "Invalid priority"
            });
        }


        // 5. Validate due date
        const taskDueDate = new Date(dueDate);

        if (isNaN(taskDueDate.getTime())) {
            return res.status(400).json({
                message: "Invalid due date"
            });
        }


        // 6. Create task
        const task = await Task.create({
            employeeId,
            title: title.trim(),
            description,
            priority,
            dueDate: taskDueDate
        });


        await logActivity({
          userId: req.user.userId,
          employeeId: task.employeeId,
          action: "Task Created",
          module: "Task",
          description: `Assigned task "${task.title}"`,
          req,
        });


        return res.status(201).json({
            message: "Task created successfully",
            task
        });

    } catch (error) {
        console.error("Create Task Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Get All Tasks
const getAllTasks = async (req, res) => {
    try {
        const {
            employeeId,
            status,
            priority,
            page = 1,
            limit = 10
        } = req.query;


        // Validate pagination
        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1
        ) {
            return res.status(400).json({
                message: "Page must be a positive integer"
            });
        }

        if (
            !Number.isInteger(limitNumber) ||
            limitNumber < 1 ||
            limitNumber > 100
        ) {
            return res.status(400).json({
                message: "Limit must be between 1 and 100"
            });
        }


        const filter = {
            isActive: true
        };


        // Filter by employee
        if (employeeId) {
            if (!mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(400).json({
                    message: "Invalid employee ID"
                });
            }

            filter.employeeId = employeeId;
        }


        // Filter by status
        if (status) {
            const validStatuses = [
                "Pending",
                "In Progress",
                "Completed"
            ];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid task status"
                });
            }

            filter.status = status;
        }


        // Filter by priority
        if (priority) {
            const validPriorities = [
                "Low",
                "Medium",
                "High"
            ];

            if (!validPriorities.includes(priority)) {
                return res.status(400).json({
                    message: "Invalid task priority"
                });
            }

            filter.priority = priority;
        }


        // Get total task count
        const totalTasks = await Task.countDocuments(filter);


        // Get paginated tasks
        const tasks = await Task.find(filter)
            .populate(
                "employeeId",
                "employeeCode firstName lastName email"
            )
            .sort({
                dueDate: 1
            })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);


        return res.status(200).json({
            message: "Tasks fetched successfully",
            count: tasks.length,
            totalTasks,
            currentPage: pageNumber,
            totalPages: Math.ceil(
                totalTasks / limitNumber
            ),
            tasks
        });

    } catch (error) {
        console.error("Get All Tasks Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Get Tasks by Employee
const getTasksByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;


        // Validate employee ID
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({
                message: "Invalid employee ID"
            });
        }


        // Check employee
        const employee = await Employee.findOne({
            _id: employeeId,
            isDeleted: false,
            isActive: true
        });

        if (!employee) {
            return res.status(404).json({
                message: "Active employee not found"
            });
        }


        // Get employee tasks
        const tasks = await Task.find({
            employeeId,
            isActive: true
        })
            .populate(
                "employeeId",
                "employeeCode firstName lastName email"
            )
            .sort({
                dueDate: 1
            });


        return res.status(200).json({
            message: "Employee tasks fetched successfully",
            count: tasks.length,
            tasks
        });

    } catch (error) {
        console.error("Get Tasks By Employee Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Update Task
const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const {
            title,
            description,
            priority,
            status,
            dueDate
        } = req.body;


        // Validate task ID
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({
                message: "Invalid task ID"
            });
        }


        // Find task
        const task = await Task.findOne({
            _id: taskId,
            isActive: true
        });

        if (!task) {
            return res.status(404).json({
                message: "Active task not found"
            });
        }


        // Update title
        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({
                    message: "Task title cannot be empty"
                });
            }

            task.title = title.trim();
        }


        // Update description
        if (description !== undefined) {
            task.description = description;
        }


        // Update priority
        if (priority !== undefined) {
            const validPriorities = [
                "Low",
                "Medium",
                "High"
            ];

            if (!validPriorities.includes(priority)) {
                return res.status(400).json({
                    message: "Invalid task priority"
                });
            }

            task.priority = priority;
        }


        // Update status
        if (status !== undefined) {
            const validStatuses = [
                "Pending",
                "In Progress",
                "Completed"
            ];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid task status"
                });
            }

            task.status = status;
        }


        // Update due date
        if (dueDate !== undefined) {
            const updatedDueDate = new Date(dueDate);

            if (isNaN(updatedDueDate.getTime())) {
                return res.status(400).json({
                    message: "Invalid due date"
                });
            }

            task.dueDate = updatedDueDate;
        }


        await task.save();


        return res.status(200).json({
            message: "Task updated successfully",
            task
        });

    } catch (error) {
        console.error("Update Task Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Soft Delete Task
const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;


        // Validate task ID
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({
                message: "Invalid task ID"
            });
        }


        // Find active task
        const task = await Task.findOne({
            _id: taskId,
            isActive: true
        });

        if (!task) {
            return res.status(404).json({
                message: "Active task not found"
            });
        }


        // Soft delete
        task.isActive = false;

        await task.save();


        return res.status(200).json({
            message: "Task deleted successfully"
        });

    } catch (error) {
        console.error("Delete Task Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Get My Tasks (Employee - own tasks only)
const getMyTasks = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find the logged-in user and get linked employeeId
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!user.employeeId) {
            return res.status(404).json({
                message: "Employee profile is not linked to this user"
            });
        }

        const { status, priority } = req.query;

        const filter = {
            employeeId: user.employeeId,
            isActive: true
        };

        // Filter by status
        if (status) {
            const validStatuses = [
                "Pending",
                "In Progress",
                "Completed"
            ];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid task status"
                });
            }

            filter.status = status;
        }

        // Filter by priority
        if (priority) {
            const validPriorities = [
                "Low",
                "Medium",
                "High"
            ];

            if (!validPriorities.includes(priority)) {
                return res.status(400).json({
                    message: "Invalid task priority"
                });
            }

            filter.priority = priority;
        }

        const tasks = await Task.find(filter)
            .sort({ dueDate: 1 });

        return res.status(200).json({
            message: "My tasks fetched successfully",
            count: tasks.length,
            tasks
        });

    } catch (error) {
        console.error("Get My Tasks Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Update My Task Status (Employee - own task, status only)
const updateMyTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;

        // Validate task ID
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({
                message: "Invalid task ID"
            });
        }

        // Validate status
        if (!status) {
            return res.status(400).json({
                message: "Status is required"
            });
        }

        const validStatuses = [
            "Pending",
            "In Progress",
            "Completed"
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid task status"
            });
        }

        // Resolve logged-in user's employeeId
        const user = await User.findById(req.user.userId);

        if (!user || !user.employeeId) {
            return res.status(404).json({
                message: "Employee profile is not linked to this user"
            });
        }

        // Find task and confirm ownership
        const task = await Task.findOne({
            _id: taskId,
            isActive: true
        });

        if (!task) {
            return res.status(404).json({
                message: "Active task not found"
            });
        }

        if (task.employeeId.toString() !== user.employeeId.toString()) {
            return res.status(403).json({
                message: "Access Denied. This task is not assigned to you."
            });
        }

        task.status = status;

        await task.save();

        return res.status(200).json({
            message: "Task status updated successfully",
            task
        });

    } catch (error) {
        console.error("Update My Task Status Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


module.exports = {
    createTask,
    getAllTasks,
    getTasksByEmployee,
    updateTask,
    deleteTask,
    getMyTasks,
    updateMyTaskStatus
};
