const mongoose = require("mongoose");

const Performance = require("../models/Performance");
const Employee = require("../models/Employee");
const User = require("../models/User");
const logActivity = require("../helpers/activityLogger");


// Create Performance Review (Admin only)
const createPerformanceReview = async (req, res) => {
    try {
        const {
            employeeId,
            reviewPeriod,
            rating,
            strengths,
            areasOfImprovement,
            feedback,
            goals
        } = req.body;

        if (!employeeId || !reviewPeriod || !rating) {
            return res.status(400).json({
                message: "Employee, review period and rating are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({
                message: "Invalid employee ID"
            });
        }

        const ratingNumber = Number(rating);

        if (
            isNaN(ratingNumber) ||
            ratingNumber < 1 ||
            ratingNumber > 5
        ) {
            return res.status(400).json({
                message: "Rating must be a number between 1 and 5"
            });
        }

        const employee = await Employee.findOne({
            _id: employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Active employee not found"
            });
        }

        // Prevent duplicate review for the same employee + period
        const existingReview = await Performance.findOne({
            employeeId,
            reviewPeriod: reviewPeriod.trim(),
            isActive: true
        });

        if (existingReview) {
            return res.status(409).json({
                message: "A performance review already exists for this employee in this review period"
            });
        }

        const review = await Performance.create({
            employeeId,
            reviewPeriod: reviewPeriod.trim(),
            rating: ratingNumber,
            strengths,
            areasOfImprovement,
            feedback,
            goals,
            reviewedBy: req.user.userId
        });

        await logActivity({
    userId: req.user.userId,
    employeeId: employeeId,
    action: "Performance Review Created",
    module: "Performance",
    description: `Performance review created for ${employee.firstName} ${employee.lastName} for ${reviewPeriod.trim()}`,
    req
});

        return res.status(201).json({
            message: "Performance review created successfully",
            review
        });

    } catch (error) {
        console.error("Create Performance Review Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Get All Performance Reviews (Admin, with optional filters)
const getAllPerformanceReviews = async (req, res) => {
    try {
        const { employeeId, reviewPeriod, minRating } = req.query;

        const filter = {
            isActive: true
        };

        if (employeeId) {
            if (!mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(400).json({
                    message: "Invalid employee ID"
                });
            }

            filter.employeeId = employeeId;
        }

        if (reviewPeriod) {
            filter.reviewPeriod = reviewPeriod;
        }

        if (minRating) {
            const min = Number(minRating);

            if (isNaN(min) || min < 1 || min > 5) {
                return res.status(400).json({
                    message: "minRating must be a number between 1 and 5"
                });
            }

            filter.rating = { $gte: min };
        }

        const reviews = await Performance.find(filter)
            .populate(
                "employeeId",
                "employeeCode firstName lastName email"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Performance reviews fetched successfully",
            count: reviews.length,
            reviews
        });

    } catch (error) {
        console.error("Get All Performance Reviews Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Get Performance Reviews by Employee (Admin)
const getPerformanceByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({
                message: "Invalid employee ID"
            });
        }

        const employee = await Employee.findOne({
            _id: employeeId,
            isActive: true,
            isDeleted: false
        });

        if (!employee) {
            return res.status(404).json({
                message: "Active employee not found"
            });
        }

        const reviews = await Performance.find({
            employeeId,
            isActive: true
        }).sort({ createdAt: -1 });

        // Calculate average rating
        const averageRating = reviews.length > 0
            ? (
                reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            ).toFixed(2)
            : null;

        return res.status(200).json({
            message: "Employee performance reviews fetched successfully",
            employee: {
                _id: employee._id,
                employeeCode: employee.employeeCode,
                firstName: employee.firstName,
                lastName: employee.lastName
            },
            count: reviews.length,
            averageRating,
            reviews
        });

    } catch (error) {
        console.error("Get Performance By Employee Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Get My Performance Reviews (Employee - self only)
const getMyPerformance = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user || !user.employeeId) {
            return res.status(404).json({
                message: "Employee profile is not linked to this user"
            });
        }

        const reviews = await Performance.find({
            employeeId: user.employeeId,
            isActive: true
        }).sort({ createdAt: -1 });

        const averageRating = reviews.length > 0
            ? (
                reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            ).toFixed(2)
            : null;

        return res.status(200).json({
            message: "My performance reviews fetched successfully",
            count: reviews.length,
            averageRating,
            reviews
        });

    } catch (error) {
        console.error("Get My Performance Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Update Performance Review (Admin only)
const updatePerformanceReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const {
            rating,
            strengths,
            areasOfImprovement,
            feedback,
            goals
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({
                message: "Invalid review ID"
            });
        }

        const review = await Performance.findOne({
            _id: reviewId,
            isActive: true
        });

        if (!review) {
            return res.status(404).json({
                message: "Active performance review not found"
            });
        }

        if (rating !== undefined) {
            const ratingNumber = Number(rating);

            if (
                isNaN(ratingNumber) ||
                ratingNumber < 1 ||
                ratingNumber > 5
            ) {
                return res.status(400).json({
                    message: "Rating must be a number between 1 and 5"
                });
            }

            review.rating = ratingNumber;
        }

        if (strengths !== undefined) review.strengths = strengths;
        if (areasOfImprovement !== undefined) review.areasOfImprovement = areasOfImprovement;
        if (feedback !== undefined) review.feedback = feedback;
        if (goals !== undefined) review.goals = goals;

await review.save();

await logActivity({
  userId: req.user.userId,
  employeeId: review.employeeId,
  action: "Performance Review Updated",
  module: "Performance",
  description: "Performance review updated",
  req,
});

return res.status(200).json({
  message: "Performance review updated successfully",
  review,
});

    } catch (error) {
        console.error("Update Performance Review Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Soft Delete Performance Review (Admin only)
const deletePerformanceReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({
                message: "Invalid review ID"
            });
        }

        const review = await Performance.findOne({
            _id: reviewId,
            isActive: true
        });

        if (!review) {
            return res.status(404).json({
                message: "Active performance review not found"
            });
        }

        review.isActive = false;

        await review.save();

        await logActivity({
            userId: req.user.userId,
            employeeId: review.employeeId,
            action: "Performance Review Deleted",
            module: "Performance",
            description: "Performance review deleted",
            req
        });

        return res.status(200).json({
            message: "Performance review deleted successfully"
        });

    } catch (error) {
        console.error("Delete Performance Review Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


module.exports = {
    createPerformanceReview,
    getAllPerformanceReviews,
    getPerformanceByEmployee,
    getMyPerformance,
    updatePerformanceReview,
    deletePerformanceReview
};