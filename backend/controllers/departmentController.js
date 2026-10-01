const Department = require("../models/Department");
const Employee = require("../models/Employee");
const logActivity = require("../helpers/activityLogger");

// Create Department
const createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check required field
        if (!name) {
            return res.status(400).json({
                message: "Department name is required."
            });
        }

        // Check if department already exists
        const existingDepartment = await Department.findOne({
            name: name.trim(),
            isDeleted: false
        });

        if (existingDepartment) {
            return res.status(409).json({
                message: "Department already exists."
            });
        }

        // Create department
        const department = await Department.create({
            name: name.trim(),
            description
        });

        await logActivity({
            userId: req.user.userId,
            employeeId: null,
            action: "Department Created",
            module: "Department",
            description: `Created new department "${department.name}"`,
            req
        });

        return res.status(201).json({
            message: "Department created successfully.",
            department
        });

    } catch (error) {
        console.error("Create Department Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Get All Departments
const getAllDepartments = async (req, res) => {
    try {
        const { search, status } = req.query;

        // Base filter
       const filter = {
    isDeleted: false
};

        // Status filter
        if (status) {
            filter.status = status;
        }

        // Search by department name
        if (search) {
            filter.name = {
                $regex: search,
                $options: "i"
            };
        }

        const departments = await Department.find(filter)
            .populate("managerId", "firstName lastName employeeCode")
            .lean();

        // Add employee count to each department
        const departmentsWithEmployeeCount = await Promise.all(
            departments.map(async (department) => {
                const employeeCount = await Employee.countDocuments({
                    departmentId: department._id,
                    isActive: true,
                    isDeleted: false
                });

                return {
                    ...department,
                    employeeCount
                };
            })
        );

        return res.status(200).json({
            message: "Departments fetched successfully.",
            count: departmentsWithEmployeeCount.length,
            departments: departmentsWithEmployeeCount
        });

    } catch (error) {
        console.error("Get Departments Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Get Department By ID
const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const department = await Department.findOne({
            _id: id,
            isDeleted: false
        }).populate(
            "managerId",
            "firstName lastName employeeCode email"
        );

        if (!department) {
            return res.status(404).json({
                message: "Department not found."
            });
        }

        return res.status(200).json({
            message: "Department fetched successfully.",
            department
        });

    } catch (error) {
        console.error("Get Department Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Update Department
const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        // Find department
        const department = await Department.findOne({
            _id: id,
            isDeleted: false
        });

        if (!department) {
            return res.status(404).json({
                message: "Department not found."
            });
        }

        // Allowed fields
        const allowedFields = [
            "name",
            "description",
            "status",
            "managerId"
        ];


       
// Validate manager

if (req.body.managerId !== undefined && req.body.managerId !== null) {

    const manager = await Employee.findOne({
        _id: req.body.managerId,
        isActive: true,
        isDeleted: false
    });

    if (!manager) {
        return res.status(404).json({
            message: "Manager employee not found."
        });
    }

    // Manager must belong to this department

    if (
        manager.departmentId &&
        manager.departmentId.toString() !== id
    ) {
        return res.status(400).json({
            message: "Manager must belong to this department."
        });
    }
}

        // Update only allowed fields
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                department[field] = req.body[field];
            }
        });

        // Check duplicate department name
        if (req.body.name !== undefined) {
            const existingDepartment = await Department.findOne({
                name: req.body.name.trim(),
                _id: { $ne: id },
                isDeleted: false
            });

            if (existingDepartment) {
                return res.status(409).json({
                    message: "Department with this name already exists."
                });
            }

            department.name = req.body.name.trim();
        }

        const updatedDepartment = await department.save();


        await logActivity({
          userId: req.user.userId,
          action: "Department Updated",
          module: "Department",
          description: `Updated department "${department.name}"`,
          req,
        });

        return res.status(200).json({
            message: "Department updated successfully.",
            department: updatedDepartment
        });

    } catch (error) {
        console.error("Update Department Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Delete Department
const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        // Find department
        const department = await Department.findOne({
            _id: id,
            isDeleted: false
        });

        if (!department) {
            return res.status(404).json({
                message: "Department not found."
            });
        }

        // Check if employees are assigned to this department
        const employeeCount = await Employee.countDocuments({
            departmentId: id,
            isDeleted: false
        });

        if (employeeCount > 0) {
            return res.status(400).json({
                message: "Cannot delete department because employees are assigned to it."
            });
        }

        // Soft delete department
        department.isDeleted = true;
        department.isActive = false;
        department.deletedAt = new Date();

        await department.save();

        return res.status(200).json({
            message: "Department deleted successfully."
        });

    } catch (error) {
        console.error("Delete Department Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


module.exports = {
    createDepartment,
    getAllDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment
};