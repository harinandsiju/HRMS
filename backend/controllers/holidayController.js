const mongoose = require("mongoose");

const Holiday = require("../models/Holiday");


// Create Holiday (Admin only)
const createHoliday = async (req, res) => {
    try {
        const { name, date, description } = req.body;

        if (!name || !date) {
            return res.status(400).json({
                message: "Name and date are required"
            });
        }

        const holidayDate = new Date(date);

        if (isNaN(holidayDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date"
            });
        }

        const holiday = await Holiday.create({
            name: name.trim(),
            date: holidayDate,
            description
        });

        return res.status(201).json({
            message: "Holiday created successfully",
            holiday
        });

    } catch (error) {
        console.error("Create Holiday Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Get All Holidays (any authenticated user)
const getAllHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.find({ isActive: true })
            .sort({ date: 1 });

        return res.status(200).json({
            message: "Holidays fetched successfully",
            count: holidays.length,
            holidays
        });

    } catch (error) {
        console.error("Get All Holidays Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Get Upcoming Holidays (any authenticated user)
const getUpcomingHolidays = async (req, res) => {
    try {
        const { limit = 5 } = req.query;

        const limitNumber = Number(limit);

        if (!Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 50) {
            return res.status(400).json({
                message: "Limit must be between 1 and 50"
            });
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const holidays = await Holiday.find({
            isActive: true,
            date: { $gte: today }
        })
            .sort({ date: 1 })
            .limit(limitNumber);

        return res.status(200).json({
            message: "Upcoming holidays fetched successfully",
            count: holidays.length,
            holidays
        });

    } catch (error) {
        console.error("Get Upcoming Holidays Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Update Holiday (Admin only)
const updateHoliday = async (req, res) => {
    try {
        const { holidayId } = req.params;
        const { name, date, description } = req.body;

        if (!mongoose.Types.ObjectId.isValid(holidayId)) {
            return res.status(400).json({
                message: "Invalid holiday ID"
            });
        }

        const holiday = await Holiday.findOne({
            _id: holidayId,
            isActive: true
        });

        if (!holiday) {
            return res.status(404).json({
                message: "Active holiday not found"
            });
        }

        if (name !== undefined) holiday.name = name.trim();

        if (date !== undefined) {
            const holidayDate = new Date(date);

            if (isNaN(holidayDate.getTime())) {
                return res.status(400).json({
                    message: "Invalid date"
                });
            }

            holiday.date = holidayDate;
        }

        if (description !== undefined) holiday.description = description;

        await holiday.save();

        return res.status(200).json({
            message: "Holiday updated successfully",
            holiday
        });

    } catch (error) {
        console.error("Update Holiday Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// Soft Delete Holiday (Admin only)
const deleteHoliday = async (req, res) => {
    try {
        const { holidayId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(holidayId)) {
            return res.status(400).json({
                message: "Invalid holiday ID"
            });
        }

        const holiday = await Holiday.findOne({
            _id: holidayId,
            isActive: true
        });

        if (!holiday) {
            return res.status(404).json({
                message: "Active holiday not found"
            });
        }

        holiday.isActive = false;

        await holiday.save();

        return res.status(200).json({
            message: "Holiday deleted successfully"
        });

    } catch (error) {
        console.error("Delete Holiday Error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


module.exports = {
    createHoliday,
    getAllHolidays,
    getUpcomingHolidays,
    updateHoliday,
    deleteHoliday
};