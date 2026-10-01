const Employee = require("../models/Employee");
const logActivity = require("../helpers/activityLogger");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const createEmployee = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            phone,
            dateOfBirth,
            gender,
            qualification,
            address,
            country,
            state,
            city,
            zip,
            personalEmail,
            alternatePhone,
            designation,
            employmentType,
            joiningDate,
            reportingManager,
            workLocation,
            departmentId,
            basicSalary,
            salaryType,
            bankName,
            accountNumber,
            ifscCode,
            emergencyContactName,
            emergencyContactPhone,
            relationship
        } = req.body;

        const profileImage = req.file
            ? `uploads/profile/${req.file.filename}`
            : null;

        // Check required fields
        if (
            !firstName ||
            !lastName ||
            !email ||
            !password ||
            !phone ||
            !dateOfBirth ||
            !gender ||
            !qualification ||
            !address ||
            !country ||
            !state ||
            !city ||
            !zip
        ) {
            return res.status(400).json({
                message: "All required employee fields must be provided."
            });
        }

        // Check password length
        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long."
            });
        }

        // Check if email already exists in Employees
        const existingEmployee = await Employee.findOne({ email });

        if (existingEmployee) {
            return res.status(409).json({
                message: "Employee with this email already exists."
            });
        }

        // Check if email already exists in Users
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "A user account with this email already exists."
            });
        }

        // Generate the next employee code
        const lastEmployee = await Employee.findOne()
            .sort({ createdAt: -1 })
            .select("employeeCode");

        let employeeNumber = 1;

        if (lastEmployee && lastEmployee.employeeCode) {
            const lastNumber = parseInt(
                lastEmployee.employeeCode.replace("EMP", ""),
                10
            );

            if (!isNaN(lastNumber)) {
                employeeNumber = lastNumber + 1;
            }
        }

        const employeeCode = `EMP${String(employeeNumber).padStart(3, "0")}`;

        // Create Employee
        const employee = await Employee.create({
            employeeCode,
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            gender,
            qualification,
            address,
            country,
            state,
            city,
            zip,
            personalEmail,
            alternatePhone,
            designation,
            employmentType,
            joiningDate,
            reportingManager,
            workLocation,
            departmentId,
            basicSalary,
            salaryType,
            bankName,
            accountNumber,
            ifscCode,
            emergencyContactName,
            emergencyContactPhone,
            relationship,
            profileImage
        });

        try {
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create User account
            const user = await User.create({
                email,
                password: hashedPassword,
                role: "Employee",
                employeeId: employee._id
            });

            // Connect User to Employee
            employee.userId = user._id;

            const updatedEmployee = await employee.save();

            await logActivity({
                userId: req.user.userId,
                employeeId: employee._id,
                action: "Employee Added",
                module: "Employee",
                description: `Added new employee "${employee.firstName} ${employee.lastName}"`,
                req
            });

            return res.status(201).json({
                message: "Employee and User account created successfully.",
                employee: updatedEmployee
            });

        } catch (userError) {
            // Remove employee if User creation fails
            await Employee.findByIdAndDelete(employee._id);

            throw userError;
        }

    } catch (error) {
        console.error("Create Employee Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


const getAllEmployees = async (req, res) => {
    try {

        const {
            search,
            status,
            gender,
            employmentType,
            designation,
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc"
        } = req.query;

        // Calculate how many employees to skip
        const skip = (Number(page) - 1) * Number(limit);

        // Fields that are allowed for sorting
        const allowedSortFields = [
            "firstName",
            "lastName",
            "employeeCode",
            "dateOfBirth",
            "joiningDate",
            "designation",
            "employmentType",
            "basicSalary",
            "createdAt"
        ];

        // Validate the requested sort field
        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";

        // Convert sort order into MongoDB sort direction
        const sortDirection = sortOrder === "asc" ? 1 : -1;

        // Base filter: only active and non-deleted employees
        const filter = {
            isActive: true,
            isDeleted: false
        };

        // Add status filter if provided
        if (status) {
            filter.status = status;
        }

        // Add gender filter if provided
        if (gender) {
            filter.gender = gender;
        }

        // Add employment type filter if provided
        if (employmentType) {
            filter.employmentType = employmentType;
        }

        // Add designation filter if provided
        if (designation) {
            filter.designation = designation;
        }

        // Add search condition if provided
        if (search) {
            filter.$or = [
                {
                    firstName: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    lastName: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    email: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    employeeCode: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }

        // Find employees with sorting and pagination
        const employees = await Employee.find(filter)
            .sort({
                [sortField]: sortDirection
            })
            .skip(skip)
            .limit(Number(limit));

        // Count all employees matching the filter
        const totalEmployees = await Employee.countDocuments(filter);

        // Calculate total number of pages
        const totalPages = Math.ceil(
            totalEmployees / Number(limit)
        );

        return res.status(200).json({
            message: "Employees fetched successfully.",
            count: employees.length,
            pagination: {
                currentPage: Number(page),
                limit: Number(limit),
                totalEmployees,
                totalPages
            },
            sorting: {
                sortBy: sortField,
                sortOrder: sortOrder === "asc" ? "asc" : "desc"
            },
            employees
        });

    } catch (error) {

        console.error("Get Employees Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });

    }
};


const getEmployeeById = async (req, res) => {
    try {

        const { id } = req.params;

        const employee = await Employee.findOne({
            _id: id,
            isActive: true
        })
        .populate("departmentId", "name");

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        return res.status(200).json({
            message: "Employee fetched successfully.",
            employee
        });

    } catch (error) {

        console.error("Get Employee Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });

    }
};


const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find the logged-in User
        const user = await User.findById(userId).select(
            "-password"
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // =========================
        // ADMIN PROFILE
        // =========================
        if (user.role === "Admin") {
            return res.status(200).json({
                message: "Admin profile fetched successfully.",
                profile: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    profileImage: user.profileImage,
                    isActive: user.isActive,
                    createdAt: user.createdAt
                }
            });
        }

        // =========================
        // EMPLOYEE PROFILE
        // =========================

        if (!user.employeeId) {
            return res.status(404).json({
                message: "Employee profile is not linked to this user."
            });
        }

        const employee = await Employee.findOne({
            _id: user.employeeId,
            isActive: true,
            isDeleted: false
        }).populate(
            "departmentId",
            "name"
        );

        if (!employee) {
            return res.status(404).json({
                message: "Employee profile not found."
            });
        }

        return res.status(200).json({
            message: "Profile fetched successfully.",
            profile: employee
        });

    } catch (error) {
        console.error("Get My Profile Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find the logged-in User
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // =========================
        // ADMIN PROFILE
        // =========================
        if (user.role === "Admin") {
            const allowedFields = [
                "firstName",
                "lastName",
                "phone"
            ];

            allowedFields.forEach((field) => {
                if (req.body[field] !== undefined) {
                    user[field] = req.body[field];
                }
            });

            if (req.file) {
                user.profileImage = `uploads/profile/${req.file.filename}`;
            }

            const updatedUser = await user.save();

            await logActivity({
                userId: user._id,
                employeeId: null,
                action: "Admin Profile Updated",
                module: "Profile",
                description: `${user.email} updated their admin profile`,
                req
            });

            return res.status(200).json({
                message: "Admin profile updated successfully.",
                profile: {
                    id: updatedUser._id,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                    phone: updatedUser.phone,
                    profileImage: updatedUser.profileImage,
                    isActive: updatedUser.isActive
                }
            });
        }

        // =========================
        // EMPLOYEE PROFILE
        // =========================

        if (!user.employeeId) {
            return res.status(404).json({
                message: "Employee profile is not linked to this user."
            });
        }

        const employee = await Employee.findOne({
            _id: user.employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee profile not found."
            });
        }

        const allowedFields = [
            "firstName",
            "lastName",
            "personalEmail",
            "phone",
            "alternatePhone",
            "dateOfBirth",
            "gender",
            "qualification",
            "address",
            "country",
            "state",
            "city",
            "zip",
            "workLocation",
            "emergencyContactName",
            "emergencyContactPhone",
            "relationship",
            "profileImage"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                employee[field] = req.body[field];
            }
        });

        if (req.file) {
            employee.profileImage = `uploads/profile/${req.file.filename}`;
        }

        const updatedEmployee = await employee.save();

        await logActivity({
            userId: req.user.userId,
            employeeId: employee._id,
            action: "Profile Updated",
            module: "Employee",
            description: `${employee.firstName} ${employee.lastName} updated their profile`,
            req
        });

        return res.status(200).json({
            message: "Profile updated successfully.",
            profile: updatedEmployee
        });

    } catch (error) {
        console.error("Update My Profile Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


const updateEmployee = async (req, res) => {
    try {

        const { id } = req.params;

        // Find the employee first
        const employee = await Employee.findOne({
            _id: id,
            isActive: true
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        // Fields that are allowed to be updated
        const allowedFields = [
            "firstName",
            "lastName",
            "email",
            "personalEmail",
            "phone",
            "alternatePhone",
            "dateOfBirth",
            "gender",
            "qualification",
            "address",
            "country",
            "state",
            "city",
            "zip",
            "designation",
            "employmentType",
            "joiningDate",
            "reportingManager",
            "workLocation",
            "departmentId",
            "basicSalary",
            "salaryType",
            "bankName",
            "accountNumber",
            "ifscCode",
            "emergencyContactName",
            "emergencyContactPhone",
            "relationship",
            "profileImage",
            "status"
        ];

        // Update only allowed fields
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                employee[field] = req.body[field];
            }
        });

        // Update profile image if a new image was uploaded
        if (req.file) {
            employee.profileImage = `uploads/profile/${req.file.filename}`;
        }

        const updatedEmployee = await employee.save();

        return res.status(200).json({
            message: "Employee updated successfully.",
            employee: updatedEmployee
        });

    } catch (error) {

        console.error("Update Employee Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });

    }
};


const deleteEmployee = async (req, res) => {
    try {

        const { id } = req.params;

        // Find the employee
        const employee = await Employee.findOne({
            _id: id,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        // Soft delete the employee
        employee.isDeleted = true;
        employee.isActive = false;
        employee.deletedAt = new Date();

        await employee.save();

        return res.status(200).json({
            message: "Employee deleted successfully."
        });

    } catch (error) {

        console.error("Delete Employee Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });

    }
};


module.exports = {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    getMyProfile,
    updateMyProfile,
    updateEmployee,
    deleteEmployee
};