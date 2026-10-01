import { useEffect, useState } from "react";

import api from "../../api/axios";

const AttendanceManagement = () => {
    // =========================
    // STATE
    // =========================

    const [summary, setSummary] = useState({
        totalEmployees: 0,
        presentToday: 0,
        absentToday: 0,
        leaveToday: 0
    });

    const [loading, setLoading] = useState(true);

    const [employees, setEmployees] = useState([]);

    const [departments, setDepartments] = useState([]);

    const [search, setSearch] = useState("");

    const [departmentFilter, setDepartmentFilter] =
        useState("");

    const [currentDate, setCurrentDate] =
        useState(new Date());

    const [attendance, setAttendance] = useState([]);

    const [attendanceLoading, setAttendanceLoading] =
        useState(false);

    // Mark Attendance Modal
    const [showMarkModal, setShowMarkModal] =
        useState(false);

    const [attendanceForm, setAttendanceForm] =
        useState({
            employeeId: "",
            date: "",
            status: "Present",
            checkIn: "",
            checkOut: "",
            workingHours: "",
            notes: ""
        });

    const [markingAttendance, setMarkingAttendance] =
        useState(false);


    // =========================
    // FETCH SUMMARY
    // =========================

const fetchSummary = async () => {
    try {
        const response =
            await api.get("/employees");

        setSummary((previous) => ({
            ...previous,
            totalEmployees:
                response.data.pagination?.totalEmployees ||
                response.data.employees?.length ||
                0
        }));

    } catch (error) {
        console.error(
            "Failed to fetch employee summary:",
            error
        );
    } finally {
        setLoading(false);
    }
};


    // =========================
    // FETCH EMPLOYEES
    // =========================

    const fetchEmployees = async () => {
        try {
            const response =
                await api.get("/employees");

            setEmployees(
                response.data.employees || []
            );
        } catch (error) {
            console.error(
                "Failed to fetch employees:",
                error
            );
        }
    };


    // =========================
    // FETCH DEPARTMENTS
    // =========================

    const fetchDepartments = async () => {
        try {
            const response =
                await api.get("/departments");

            setDepartments(
                response.data.departments || []
            );
        } catch (error) {
            console.error(
                "Failed to fetch departments:",
                error
            );
        }
    };


    // =========================
    // FETCH MONTHLY ATTENDANCE
    // =========================

    const fetchMonthlyAttendance = async () => {
        try {
            setAttendanceLoading(true);

            const year =
                currentDate.getFullYear();

            const month =
                currentDate.getMonth();

            const startDate = new Date(
                year,
                month,
                1
            );

            const endDate = new Date(
                year,
                month + 1,
                0
            );


            const formatDate = (date) => {
                const year =
                    date.getFullYear();

                const month =
                    String(
                        date.getMonth() + 1
                    ).padStart(2, "0");

                const day =
                    String(
                        date.getDate()
                    ).padStart(2, "0");

                return `${year}-${month}-${day}`;
            };


            const response = await api.get(
                "/attendance",
                {
                    params: {
                        startDate:
                            formatDate(startDate),

                        endDate:
                            formatDate(endDate)
                    }
                }
            );


            setAttendance(
                response.data.attendance || []
            );

        } catch (error) {
            console.error(
                "Failed to fetch monthly attendance:",
                error
            );
        } finally {
            setAttendanceLoading(false);
        }
    };



    // =========================
// FETCH TODAY'S SUMMARY
// =========================

const fetchTodaySummary = async () => {
    try {
        const today = new Date();

        const formatDate = (date) => {
            const year =
                date.getFullYear();

            const month =
                String(
                    date.getMonth() + 1
                ).padStart(2, "0");

            const day =
                String(
                    date.getDate()
                ).padStart(2, "0");

            return `${year}-${month}-${day}`;
        };

        const todayString =
            formatDate(today);

        const response =
            await api.get("/attendance", {
                params: {
                    startDate: todayString,
                    endDate: todayString
                }
            });

        const todayRecords =
            response.data.attendance || [];

        const presentToday =
            todayRecords.filter(
                (record) =>
                    record.status ===
                    "Present"
            ).length;

        const absentToday =
            todayRecords.filter(
                (record) =>
                    record.status ===
                    "Absent"
            ).length;

        const leaveToday =
            todayRecords.filter(
                (record) =>
                    record.status ===
                    "Leave"
            ).length;

        setSummary((previous) => ({
            ...previous,
            presentToday,
            absentToday,
            leaveToday
        }));

    } catch (error) {
        console.error(
            "Failed to fetch today's attendance summary:",
            error
        );
    }
};


    // =========================
    // INITIAL LOAD
    // =========================

    useEffect(() => {
        fetchSummary();
        fetchTodaySummary();
        fetchEmployees();
        fetchDepartments();
    }, []);


    // =========================
    // LOAD ATTENDANCE
    // WHEN MONTH CHANGES
    // =========================

    useEffect(() => {
        fetchMonthlyAttendance();
    }, [currentDate]);


    // =========================
    // MONTH INFORMATION
    // =========================

    const monthName =
        currentDate.toLocaleString(
            "default",
            {
                month: "long"
            }
        );

    const currentYear =
        currentDate.getFullYear();


    const daysInMonth =
        new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0
        ).getDate();


    const monthDays = Array.from(
        {
            length: daysInMonth
        },
        (_, index) => index + 1
    );


    // =========================
    // GET ATTENDANCE FOR DAY
    // =========================

const getAttendanceForDay = (
    employeeId,
    day
) => {
    return attendance.find((record) => {

        const recordDate =
            new Date(record.date);

        const recordEmployeeId =
            typeof record.employeeId ===
            "object"
                ? record.employeeId?._id
                : record.employeeId;

        return (
            recordEmployeeId ===
                employeeId &&

            recordDate.getDate() ===
                day &&

            recordDate.getMonth() ===
                currentDate.getMonth() &&

            recordDate.getFullYear() ===
                currentDate.getFullYear()
        );
    });
};


    // =========================
    // FILTER EMPLOYEES
    // =========================

    const filteredEmployees =
        employees.filter((employee) => {

            const fullName =
                `${employee.firstName || ""} ${
                    employee.lastName || ""
                }`.toLowerCase();


            const searchValue =
                search.toLowerCase();


            const matchesSearch =
                fullName.includes(
                    searchValue
                ) ||

                employee.employeeCode
                    ?.toLowerCase()
                    .includes(searchValue);


            const departmentId =
                typeof employee.departmentId ===
                "object"
                    ? employee.departmentId?._id
                    : employee.departmentId;


            const matchesDepartment =
                !departmentFilter ||
                departmentId ===
                    departmentFilter;


            return (
                matchesSearch &&
                matchesDepartment
            );
        });


    // =========================
    // PREVIOUS MONTH
    // =========================

    const goToPreviousMonth = () => {
        setCurrentDate(
            new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() - 1,
                1
            )
        );
    };


    // =========================
    // NEXT MONTH
    // =========================

    const goToNextMonth = () => {
        setCurrentDate(
            new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                1
            )
        );
    };


    // =========================
    // ATTENDANCE FORM CHANGE
    // =========================

    const handleAttendanceChange = (e) => {
        const {
            name,
            value
        } = e.target;


        setAttendanceForm(
            (previous) => ({
                ...previous,
                [name]: value
            })
        );
    };


    // =========================
    // MARK ATTENDANCE
    // =========================

    const handleMarkAttendance = async (e) => {
        e.preventDefault();

        try {
            setMarkingAttendance(true);


            const payload = {
                employeeId:
                    attendanceForm.employeeId,

                date:
                    attendanceForm.date,

                status:
                    attendanceForm.status,

                checkIn:
                    attendanceForm.checkIn
                        ? new Date(
                              attendanceForm.checkIn
                          ).toISOString()
                        : null,

                checkOut:
                    attendanceForm.checkOut
                        ? new Date(
                              attendanceForm.checkOut
                          ).toISOString()
                        : null,

                workingHours:
                    attendanceForm.workingHours
                        ? Number(
                              attendanceForm.workingHours
                          )
                        : 0,

                notes:
                    attendanceForm.notes
            };


            await api.post(
                "/attendance",
                payload
            );


            setAttendanceForm({
                employeeId: "",
                date: "",
                status: "Present",
                checkIn: "",
                checkOut: "",
                workingHours: "",
                notes: ""
            });


            setShowMarkModal(false);


            // Refresh attendance grid
            await fetchMonthlyAttendance();

            // Refresh today's summary cards
            await fetchTodaySummary();

        } catch (error) {

            console.error(
                "Failed to mark attendance:",
                error
            );


            alert(
                error.response?.data?.message ||
                "Failed to mark attendance."
            );

        } finally {
            setMarkingAttendance(false);
        }
    };


    // =========================
    // SUMMARY PERCENTAGES
    // =========================

    const presentPercentage =
        summary.totalEmployees > 0
            ? (
                  (summary.presentToday /
                      summary.totalEmployees) *
                  100
              ).toFixed(2)
            : 0;


    const absentPercentage =
        summary.totalEmployees > 0
            ? (
                  (summary.absentToday /
                      summary.totalEmployees) *
                  100
              ).toFixed(2)
            : 0;


    const leavePercentage =
        summary.totalEmployees > 0
            ? (
                  (summary.leaveToday /
                      summary.totalEmployees) *
                  100
              ).toFixed(2)
            : 0;


    // =========================
    // RENDER
    // =========================

    return (
        <div className="min-h-screen bg-gray-50 p-6">

            {/* =========================
                HEADER
            ========================== */}

            <div className="mb-6">

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">

                    <span className="text-indigo-600">
                        Dashboard
                    </span>

                    <span>›</span>

                    <span className="text-gray-700">
                        Attendance
                    </span>

                </div>


                <h1 className="text-2xl font-bold text-gray-900">
                    Attendance Management
                </h1>


                <p className="text-sm text-gray-500 mt-1">
                    Track employee attendance and
                    monthly summary.
                </p>

            </div>


            {/* =========================
                SUMMARY CARDS
            ========================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                {/* Total Employees */}

                <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition">

                    <div className="flex items-start justify-between">

                        <div>

                            <p className="text-sm text-gray-500">
                                Total Employees
                            </p>

                            <h2 className="text-2xl font-bold text-gray-900 mt-2">
                                {loading
                                    ? "..."
                                    : summary.totalEmployees}
                            </h2>

                            <p className="text-xs text-gray-400 mt-1">
                                All Employees
                            </p>

                        </div>


                        <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">

                            <span className="text-xl">
                                #
                            </span>

                        </div>

                    </div>

                </div>


                {/* Present Today */}

                <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition">

                    <div className="flex items-start justify-between">

                        <div>

                            <p className="text-sm text-gray-500">
                                Present Today
                            </p>

                            <h2 className="text-2xl font-bold text-gray-900 mt-2">
                                {loading
                                    ? "..."
                                    : summary.presentToday}
                            </h2>

                            <p className="text-xs text-green-600 mt-1">
                                {presentPercentage}% of total
                            </p>

                        </div>


                        <div className="w-11 h-11 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">

                            <span className="text-xl">
                                ✓
                            </span>

                        </div>

                    </div>

                </div>


                {/* Absent Today */}

                <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition">

                    <div className="flex items-start justify-between">

                        <div>

                            <p className="text-sm text-gray-500">
                                Absent Today
                            </p>

                            <h2 className="text-2xl font-bold text-gray-900 mt-2">
                                {loading
                                    ? "..."
                                    : summary.absentToday}
                            </h2>

                            <p className="text-xs text-red-600 mt-1">
                                {absentPercentage}% of total
                            </p>

                        </div>


                        <div className="w-11 h-11 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">

                            <span className="text-xl">
                                ×
                            </span>

                        </div>

                    </div>

                </div>


                {/* On Leave */}

                <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition">

                    <div className="flex items-start justify-between">

                        <div>

                            <p className="text-sm text-gray-500">
                                On Leave
                            </p>

                            <h2 className="text-2xl font-bold text-gray-900 mt-2">
                                {loading
                                    ? "..."
                                    : summary.leaveToday}
                            </h2>

                            <p className="text-xs text-orange-500 mt-1">
                                {leavePercentage}% of total
                            </p>

                        </div>


                        <div className="w-11 h-11 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">

                            <span className="text-xl">
                                L
                            </span>

                        </div>

                    </div>

                </div>

            </div>


            {/* =========================
                ATTENDANCE CONTROLS
            ========================== */}

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mt-5">

                {/* Top Row */}

                <div className="flex justify-between items-center mb-4">

                    <div>

                        <h2 className="text-lg font-semibold text-gray-900">
                            Attendance
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Manage employee attendance
                        </p>

                    </div>


                    <button
                        onClick={() =>
                            setShowMarkModal(true)
                        }
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        + Mark Attendance
                    </button>

                </div>


                {/* Filters */}

                <div className="flex flex-col lg:flex-row items-center gap-3">

                    {/* Search */}

                    <div className="relative w-full lg:flex-1">

                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                            ⌕
                        </span>

                        <input
                            type="text"
                            placeholder="Search employee..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                        />

                    </div>


                    {/* Department */}

                    <select
                        value={departmentFilter}
                        onChange={(e) =>
                            setDepartmentFilter(
                                e.target.value
                            )
                        }
                        className="w-full lg:w-60 border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-100"
                    >

                        <option value="">
                            All Departments
                        </option>


                        {departments.map(
                            (department) => (

                                <option
                                    key={department._id}
                                    value={department._id}
                                >
                                    {department.name}
                                </option>

                            )
                        )}

                    </select>


                    {/* Previous Month */}

                    <button
                        onClick={
                            goToPreviousMonth
                        }
                        className="w-11 h-11 border border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-50 transition text-xl"
                        title="Previous Month"
                    >
                        ‹
                    </button>


                    {/* Current Month */}

                    <div className="min-w-36 text-center">

                        <p className="font-semibold text-gray-800">
                            {monthName}{" "}
                            {currentYear}
                        </p>

                    </div>


                    {/* Next Month */}

                    <button
                        onClick={
                            goToNextMonth
                        }
                        className="w-11 h-11 border border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-50 transition text-xl"
                        title="Next Month"
                    >
                        ›
                    </button>

                </div>

            </div>


            {/* =========================
                MONTHLY ATTENDANCE GRID
            ========================== */}

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm mt-5 overflow-hidden">

                <div className="px-5 py-4 border-b border-gray-200">

                    <h3 className="text-lg font-semibold text-gray-900">
                        Monthly Attendance
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                        Attendance records for{" "}
                        {monthName} {currentYear}
                    </p>

                </div>


                <div className="overflow-x-auto">

                    <table className="min-w-max w-full border-collapse">

                        <thead>

                            <tr className="bg-gray-50 border-b border-gray-200">

                                <th className="sticky left-0 z-20 bg-gray-50 px-5 py-3 text-left text-xs font-semibold text-gray-600 border-r border-gray-200 min-w-64">
                                    Employee
                                </th>


                                {monthDays.map(
                                    (day) => (

                                        <th
                                            key={day}
                                            className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-14"
                                        >
                                            {day}
                                        </th>

                                    )
                                )}

                            </tr>

                        </thead>


                        <tbody>

                            {attendanceLoading ? (

                                <tr>

                                    <td
                                        colSpan={
                                            monthDays.length +
                                            1
                                        }
                                        className="px-5 py-12 text-center text-sm text-gray-500"
                                    >
                                        Loading attendance...
                                    </td>

                                </tr>

                            ) : filteredEmployees.length ===
                              0 ? (

                                <tr>

                                    <td
                                        colSpan={
                                            monthDays.length +
                                            1
                                        }
                                        className="px-5 py-12 text-center text-sm text-gray-500"
                                    >
                                        No employees found.
                                    </td>

                                </tr>

                            ) : (

                                filteredEmployees.map(
                                    (employee) => (

                                        <tr
                                            key={
                                                employee._id
                                            }
                                            className="border-b border-gray-100 hover:bg-gray-50 transition"
                                        >

                                            {/* Employee */}

                                            <td className="sticky left-0 z-10 bg-white px-5 py-4 border-r border-gray-200">

                                                <div className="flex items-center gap-3">

                                                    <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-sm">

                                                        {employee.firstName
                                                            ?.charAt(
                                                                0
                                                            )
                                                            ?.toUpperCase()}

                                                    </div>


                                                    <div>

                                                        <p className="text-sm font-medium text-gray-800">

                                                            {
                                                                employee.firstName
                                                            }{" "}

                                                            {
                                                                employee.lastName
                                                            }

                                                        </p>


                                                        <p className="text-xs text-gray-400">

                                                            {
                                                                employee.employeeCode
                                                            }

                                                        </p>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* Daily Attendance */}

                                            {monthDays.map(
                                                (day) => {

                                                    const record =
                                                        getAttendanceForDay(
                                                            employee._id,
                                                            day
                                                        );


                                                    let symbol =
                                                        "—";

                                                    let symbolClass =
                                                        "text-gray-300";


                                                    if (
                                                        record
                                                    ) {

                                                        if (
                                                            record.status ===
                                                            "Present"
                                                        ) {

                                                            symbol =
                                                                "✓";

                                                            symbolClass =
                                                                "text-green-600 font-semibold";

                                                        } else if (
                                                            record.status ===
                                                            "Absent"
                                                        ) {

                                                            symbol =
                                                                "×";

                                                            symbolClass =
                                                                "text-red-600 font-semibold";

                                                        } else if (
                                                            record.status ===
                                                            "Half Day"
                                                        ) {

                                                            symbol =
                                                                "½";

                                                            symbolClass =
                                                                "text-yellow-600 font-semibold";

                                                        } else if (
                                                            record.status ===
                                                            "Leave"
                                                        ) {

                                                            symbol =
                                                                "L";

                                                            symbolClass =
                                                                "text-orange-500 font-semibold";

                                                        }

                                                    }


                                                    return (

                                                        <td
                                                            key={
                                                                day
                                                            }
                                                            className="px-3 py-4 text-center text-sm"
                                                        >

                                                            <span
                                                                className={
                                                                    symbolClass
                                                                }
                                                            >
                                                                {
                                                                    symbol
                                                                }
                                                            </span>

                                                        </td>

                                                    );

                                                }
                                            )}

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* =========================
                MARK ATTENDANCE MODAL
            ========================== */}

            {showMarkModal && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

                    <div className="bg-white w-full max-w-lg rounded-xl shadow-xl">

                        {/* Modal Header */}

                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">

                            <div>

                                <h2 className="text-lg font-semibold text-gray-900">
                                    Mark Attendance
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Add attendance for an employee
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    setShowMarkModal(false)
                                }
                                disabled={
                                    markingAttendance
                                }
                                className="text-gray-400 hover:text-gray-600 text-xl disabled:opacity-50"
                            >
                                ×
                            </button>

                        </div>


                        {/* Form */}

                        <form
                            onSubmit={
                                handleMarkAttendance
                            }
                            className="p-6 space-y-5"
                        >

                            {/* Employee */}

                            <div>

                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Employee
                                </label>

                                <select
                                    name="employeeId"
                                    value={
                                        attendanceForm.employeeId
                                    }
                                    onChange={
                                        handleAttendanceChange
                                    }
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                >

                                    <option value="">
                                        Select Employee
                                    </option>


                                    {employees.map(
                                        (employee) => (

                                            <option
                                                key={
                                                    employee._id
                                                }
                                                value={
                                                    employee._id
                                                }
                                            >
                                                {
                                                    employee.firstName
                                                }{" "}
                                                {
                                                    employee.lastName
                                                }{" "}
                                                —{" "}
                                                {
                                                    employee.employeeCode
                                                }
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            {/* Date + Status */}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                <div>

                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date
                                    </label>

                                    <input
                                        type="date"
                                        name="date"
                                        value={
                                            attendanceForm.date
                                        }
                                        onChange={
                                            handleAttendanceChange
                                        }
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    />

                                </div>


                                <div>

                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>

                                    <select
                                        name="status"
                                        value={
                                            attendanceForm.status
                                        }
                                        onChange={
                                            handleAttendanceChange
                                        }
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    >

                                        <option value="Present">
                                            Present
                                        </option>

                                        <option value="Absent">
                                            Absent
                                        </option>

                                        <option value="Half Day">
                                            Half Day
                                        </option>

                                        <option value="Leave">
                                            Leave
                                        </option>

                                    </select>

                                </div>

                            </div>


                            {/* Check In + Check Out */}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                <div>

                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Check In
                                    </label>

                                    <input
                                        type="datetime-local"
                                        name="checkIn"
                                        value={
                                            attendanceForm.checkIn
                                        }
                                        onChange={
                                            handleAttendanceChange
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    />

                                </div>


                                <div>

                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Check Out
                                    </label>

                                    <input
                                        type="datetime-local"
                                        name="checkOut"
                                        value={
                                            attendanceForm.checkOut
                                        }
                                        onChange={
                                            handleAttendanceChange
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    />

                                </div>

                            </div>


                            {/* Working Hours */}

                            <div>

                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Working Hours
                                </label>

                                <input
                                    type="number"
                                    name="workingHours"
                                    value={
                                        attendanceForm.workingHours
                                    }
                                    onChange={
                                        handleAttendanceChange
                                    }
                                    min="0"
                                    step="0.5"
                                    placeholder="Example: 8"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                />

                            </div>


                            {/* Notes */}

                            <div>

                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>

                                <textarea
                                    name="notes"
                                    value={
                                        attendanceForm.notes
                                    }
                                    onChange={
                                        handleAttendanceChange
                                    }
                                    rows="3"
                                    placeholder="Optional notes..."
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-indigo-500"
                                />

                            </div>


                            {/* Footer */}

                            <div className="flex justify-end gap-3 pt-2">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowMarkModal(false)
                                    }
                                    disabled={
                                        markingAttendance
                                    }
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    disabled={
                                        markingAttendance
                                    }
                                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:bg-indigo-400"
                                >
                                    {markingAttendance
                                        ? "Saving..."
                                        : "Save Attendance"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
};

export default AttendanceManagement;