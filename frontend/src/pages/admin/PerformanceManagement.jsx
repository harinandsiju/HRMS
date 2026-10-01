import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const initialReviewForm = {
    employeeId: "",
    reviewPeriod: "",
    rating: "",
    strengths: "",
    areasOfImprovement: "",
    feedback: "",
    goals: ""
};

const PAGE_SIZE = 8;

function PerformanceManagement() {
    const { user } = useAuth();

    const [reviews, setReviews] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [periodFilter, setPeriodFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);

    const [selectedReview, setSelectedReview] = useState(null);
    const [detailsVisible, setDetailsVisible] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const [reviewForm, setReviewForm] = useState(
        initialReviewForm
    );

    const [reviewToDelete, setReviewToDelete] = useState(null);

    const [toast, setToast] = useState(null);

    // =========================
    // TOAST
    // =========================

    const showToast = (message, type = "success") => {
        setToast({
            id: Date.now(),
            message,
            type
        });

        setTimeout(() => {
            setToast(null);
        }, 3500);
    };

    // =========================
    // BODY SCROLL LOCK
    // =========================

    useEffect(() => {
        const locked =
            showAddModal ||
            showEditModal ||
            reviewToDelete ||
            detailsVisible;

        document.body.style.overflow = locked
            ? "hidden"
            : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [
        showAddModal,
        showEditModal,
        reviewToDelete,
        detailsVisible
    ]);

    // =========================
    // FETCH DATA
    // =========================

    const fetchData = async () => {
        try {
            setLoading(true);

            const [
                reviewsResponse,
                employeesResponse,
                departmentsResponse
            ] = await Promise.all([
                api.get("/performance"),
                api.get("/employees?page=1&limit=100"),
                api.get("/departments")
            ]);

            setReviews(
                reviewsResponse.data.reviews || []
            );

            setEmployees(
                employeesResponse.data.employees || []
            );

            setDepartments(
                departmentsResponse.data.departments || []
            );
        } catch (error) {
            console.error(
                "Fetch performance data error:",
                error
            );

            showToast(
                error.response?.data?.message ||
                    "Failed to load performance data.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // =========================
    // EMPLOYEE HELPERS
    // =========================

    const getEmployeeId = (review) => {
        if (!review?.employeeId) {
            return "";
        }

        if (
            typeof review.employeeId ===
            "object"
        ) {
            return review.employeeId?._id || "";
        }

        return review.employeeId;
    };

    /*
     * IMPORTANT:
     * Always find the employee from the
     * employees array first.
     *
     * This gives us the complete employee
     * object including departmentId.
     */
    const getEmployee = (review) => {
        const employeeId =
            getEmployeeId(review);

        const employee = employees.find(
            (item) =>
                item._id === employeeId
        );

        if (employee) {
            return employee;
        }

        if (
            review?.employeeId &&
            typeof review.employeeId ===
                "object"
        ) {
            return review.employeeId;
        }

        return null;
    };

    const getEmployeeName = (review) => {
        const employee =
            getEmployee(review);

        if (!employee) {
            return "Unknown Employee";
        }

        return `${employee.firstName || ""} ${
            employee.lastName || ""
        }`.trim();
    };

    const getEmployeeDesignation = (
        review
    ) => {
        const employee =
            getEmployee(review);

        return (
            employee?.designation ||
            "Employee"
        );
    };

    const getEmployeeCode = (review) => {
        const employee =
            getEmployee(review);

        return (
            employee?.employeeCode ||
            "—"
        );
    };

    // =========================
    // DEPARTMENT HELPERS
    // =========================

    const getDepartmentId = (review) => {
        const employee =
            getEmployee(review);

        if (!employee?.departmentId) {
            return "";
        }

        if (
            typeof employee.departmentId ===
            "object"
        ) {
            return (
                employee.departmentId?._id ||
                ""
            );
        }

        return employee.departmentId;
    };

    const getDepartmentName = (review) => {
        const employee =
            getEmployee(review);

        if (!employee) {
            return "—";
        }

        if (
            employee.departmentId &&
            typeof employee.departmentId ===
                "object"
        ) {
            return (
                employee.departmentId.name ||
                employee.departmentId.departmentName ||
                "—"
            );
        }

        const department =
            departments.find(
                (item) =>
                    item._id ===
                    employee.departmentId
            );

        return (
            department?.name ||
            department?.departmentName ||
            "—"
        );
    };

    // =========================
    // DATE / PERIOD HELPERS
    // =========================

    const formatPeriod = (period) => {
        if (!period) {
            return "—";
        }

        if (/^\d{4}-\d{2}$/.test(period)) {
            const [year, month] =
                period.split("-");

            const date = new Date(
                Number(year),
                Number(month) - 1,
                1
            );

            return date.toLocaleDateString(
                "en-US",
                {
                    month: "long",
                    year: "numeric"
                }
            );
        }

        return period;
    };

    const convertMonthToPeriod = (value) => {
        if (!value) {
            return "";
        }

        const [year, month] =
            value.split("-");

        const date = new Date(
            Number(year),
            Number(month) - 1,
            1
        );

        return date.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        );
    };

    const periodToInputValue = (period) => {
        if (!period) {
            return "";
        }

        if (/^\d{4}-\d{2}$/.test(period)) {
            return period;
        }

        const match =
            period.match(
                /^([A-Za-z]+)\s+(\d{4})$/
            );

        if (!match) {
            return "";
        }

        const monthName = match[1];
        const year = match[2];

        const date = new Date(
            `${monthName} 1, ${year}`
        );

        if (isNaN(date.getTime())) {
            return "";
        }

        return `${year}-${String(
            date.getMonth() + 1
        ).padStart(2, "0")}`;
    };

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "—";
        }

        const date = new Date(dateValue);

        if (isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString(
            "en-US",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    };

    // =========================
    // REVIEWER
    // =========================

const getReviewerName = () => {
    const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

    return fullName || user?.email || "Admin";
};
    // =========================
    // FILTER OPTIONS
    // =========================

    const availablePeriods = useMemo(() => {
        return [
            ...new Set(
                reviews
                    .map(
                        (review) =>
                            review.reviewPeriod
                    )
                    .filter(Boolean)
            )
        ];
    }, [reviews]);

    // =========================
    // FILTERED REVIEWS
    // =========================

    const filteredReviews = useMemo(() => {
        const searchValue =
            search.trim().toLowerCase();

        return reviews.filter((review) => {
            const employeeName =
                getEmployeeName(review)
                    .toLowerCase();

            const employeeCode =
                getEmployeeCode(review)
                    .toLowerCase();

            const matchesSearch =
                !searchValue ||
                employeeName.includes(
                    searchValue
                ) ||
                employeeCode.includes(
                    searchValue
                );

            const matchesDepartment =
                !departmentFilter ||
                getDepartmentId(review) ===
                    departmentFilter;

            const matchesPeriod =
                !periodFilter ||
                review.reviewPeriod ===
                    periodFilter;

            return (
                matchesSearch &&
                matchesDepartment &&
                matchesPeriod
            );
        });
    }, [
        reviews,
        employees,
        departments,
        search,
        departmentFilter,
        periodFilter
    ]);

    // =========================
    // SUMMARY
    // =========================

    const totalReviews =
        filteredReviews.length;

    /*
     * In the current Performance workflow,
     * a saved review is a completed review.
     *
     * There is no Pending/Status field in
     * the backend.
     */
    const completedReviews =
        filteredReviews.length;

    const averageRating =
        filteredReviews.length > 0
            ? (
                  filteredReviews.reduce(
                      (sum, review) =>
                          sum +
                          Number(
                              review.rating || 0
                          ),
                      0
                  ) /
                  filteredReviews.length
              ).toFixed(1)
            : "0.0";

    // =========================
    // PAGINATION
    // =========================

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredReviews.length /
                PAGE_SIZE
        )
    );

    const paginatedReviews =
        filteredReviews.slice(
            (currentPage - 1) *
                PAGE_SIZE,
            currentPage * PAGE_SIZE
        );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // =========================
    // RESET FILTERS
    // =========================

    const clearFilters = () => {
        setSearch("");
        setDepartmentFilter("");
        setPeriodFilter("");
        setCurrentPage(1);
    };

    // =========================
    // ADD REVIEW
    // =========================

    const openAddModal = () => {
        setReviewForm({
            ...initialReviewForm
        });

        setShowAddModal(true);
    };

    const closeAddModal = () => {
        if (saving) {
            return;
        }

        setShowAddModal(false);

        setReviewForm({
            ...initialReviewForm
        });
    };

    // =========================
    // DETAILS PANEL
    // =========================

    const openDetails = (review) => {
        setSelectedReview(review);

        requestAnimationFrame(() => {
            setDetailsVisible(true);
        });
    };

    const closeDetails = () => {
        setDetailsVisible(false);

        setTimeout(() => {
            setSelectedReview(null);
        }, 300);
    };

    // =========================
    // EDIT REVIEW
    // =========================

    const openEditModal = (review) => {
        setSelectedReview(review);

        setReviewForm({
            employeeId:
                getEmployeeId(review),

            reviewPeriod:
                review.reviewPeriod || "",

            rating:
                review.rating ?? "",

            strengths:
                review.strengths || "",

            areasOfImprovement:
                review.areasOfImprovement ||
                "",

            feedback:
                review.feedback || "",

            goals:
                review.goals || ""
        });

        setDetailsVisible(false);

        setTimeout(() => {
            setShowEditModal(true);
        }, 300);
    };

    // =========================
    // FORM CHANGE
    // =========================

    const handleFormChange = (e) => {
        const {
            name,
            value
        } = e.target;

        setReviewForm((current) => ({
            ...current,
            [name]: value
        }));
    };

    // =========================
    // VALIDATION
    // =========================

    const validateReview = () => {
        if (!reviewForm.employeeId) {
            showToast(
                "Please select an employee.",
                "error"
            );
            return false;
        }

        if (!reviewForm.reviewPeriod) {
            showToast(
                "Please select a review month.",
                "error"
            );
            return false;
        }

        if (!reviewForm.rating) {
            showToast(
                "Please select a rating.",
                "error"
            );
            return false;
        }

        return true;
    };

    // =========================
    // CREATE REVIEW
    // =========================

    const handleCreateReview = async (e) => {
        e.preventDefault();

        if (!validateReview()) {
            return;
        }

        try {
            setSaving(true);

            await api.post(
                "/performance",
                {
                    employeeId:
                        reviewForm.employeeId,

                    reviewPeriod:
                        convertMonthToPeriod(
                            reviewForm.reviewPeriod
                        ),

                    rating:
                        Number(
                            reviewForm.rating
                        ),

                    strengths:
                        reviewForm.strengths.trim(),

                    areasOfImprovement:
                        reviewForm.areasOfImprovement.trim(),

                    feedback:
                        reviewForm.feedback.trim(),

                    goals:
                        reviewForm.goals.trim()
                }
            );

            setShowAddModal(false);

            setReviewForm({
                ...initialReviewForm
            });

            setCurrentPage(1);

            await fetchData();

            showToast(
                "Performance review created successfully.",
                "success"
            );
        } catch (error) {
            console.error(
                "Create performance review error:",
                error
            );

            showToast(
                error.response?.data?.message ||
                    "Failed to create performance review.",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================
    // UPDATE REVIEW
    // =========================

    const handleUpdateReview = async (e) => {
        e.preventDefault();

        if (!selectedReview?._id) {
            showToast(
                "Review could not be identified.",
                "error"
            );
            return;
        }

        if (!reviewForm.rating) {
            showToast(
                "Please select a rating.",
                "error"
            );
            return;
        }

        try {
            setSaving(true);

            await api.put(
                `/performance/${selectedReview._id}`,
                {
                    rating:
                        Number(
                            reviewForm.rating
                        ),

                    strengths:
                        reviewForm.strengths.trim(),

                    areasOfImprovement:
                        reviewForm.areasOfImprovement.trim(),

                    feedback:
                        reviewForm.feedback.trim(),

                    goals:
                        reviewForm.goals.trim()
                }
            );

            setShowEditModal(false);

            setReviewForm({
                ...initialReviewForm
            });

            await fetchData();

            showToast(
                "Performance review updated successfully.",
                "success"
            );
        } catch (error) {
            console.error(
                "Update performance review error:",
                error
            );

            showToast(
                error.response?.data?.message ||
                    "Failed to update performance review.",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================
    // DELETE
    // =========================

    const openDeleteModal = (review) => {
        setReviewToDelete(review);
    };

    const handleDeleteReview = async () => {
        if (!reviewToDelete?._id) {
            return;
        }

        try {
            setDeleting(true);

            await api.delete(
                `/performance/${reviewToDelete._id}`
            );

            const deletedId =
                reviewToDelete._id;

            setReviews(
                (currentReviews) =>
                    currentReviews.filter(
                        (review) =>
                            review._id !==
                            deletedId
                    )
            );

            if (
                selectedReview?._id ===
                deletedId
            ) {
                closeDetails();
            }

            setReviewToDelete(null);

            showToast(
                "Performance review deleted successfully.",
                "success"
            );
        } catch (error) {
            console.error(
                "Delete performance review error:",
                error
            );

            showToast(
                error.response?.data?.message ||
                    "Failed to delete performance review.",
                "error"
            );
        } finally {
            setDeleting(false);
        }
    };

    // =========================
    // SELECTED EMPLOYEE
    // =========================

    const selectedEmployee =
        employees.find(
            (employee) =>
                employee._id ===
                reviewForm.employeeId
        );

    let selectedDepartmentName = "";

    if (
        selectedEmployee?.departmentId &&
        typeof selectedEmployee.departmentId ===
            "object"
    ) {
        selectedDepartmentName =
            selectedEmployee.departmentId.name ||
            selectedEmployee.departmentId.departmentName ||
            "";
    } else {
        const department =
            departments.find(
                (item) =>
                    item._id ===
                    selectedEmployee?.departmentId
            );

        selectedDepartmentName =
            department?.name ||
            department?.departmentName ||
            "";
    }

    // =========================
    // UI
    // =========================

    return (
        <>
            <style>{`
                @keyframes performanceFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes performanceModalIn {
                    from {
                        opacity: 0;
                        transform: scale(.96) translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                @keyframes performanceBackdropIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes performancePanelIn {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }

                @keyframes performancePanelOut {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(100%);
                    }
                }

                @keyframes performanceToastIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .performance-fade-in {
                    animation: performanceFadeIn .25s ease-out;
                }

                .performance-modal-in {
                    animation: performanceModalIn .22s ease-out;
                }

                .performance-backdrop {
                    animation: performanceBackdropIn .2s ease-out;
                }

                .performance-panel {
                    animation: performancePanelIn .3s ease-out;
                }

                .performance-panel.closing {
                    animation: performancePanelOut .3s ease-in forwards;
                }

                .performance-toast {
                    animation: performanceToastIn .25s ease-out;
                }

                .performance-input {
                    width: 100%;
                    min-height: 44px;
                    border: 1px solid rgb(229 231 235);
                    border-radius: 8px;
                    padding: 10px 14px;
                    font-size: 14px;
                    color: rgb(55 65 81);
                    outline: none;
                    background: white;
                }

                .performance-input:focus {
                    border-color: transparent;
                    box-shadow: 0 0 0 2px rgb(99 102 241);
                }

                textarea.performance-input {
                    min-height: auto;
                }
            `}</style>

            <div className="space-y-6 performance-fade-in">

                {/* PAGE HEADER */}

                <div className="flex items-center justify-between">

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Performance Management
                        </h1>

                        <p className="text-sm text-gray-500 mt-1">

                            <span className="text-indigo-600">
                                Home
                            </span>

                            <span className="mx-2">
                                <i className="fas fa-chevron-right text-[10px]" />
                            </span>

                            Performance Management

                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                    >
                        <i className="fas fa-plus" />
                        Add Review
                    </button>

                </div>

                {/* SUMMARY CARDS */}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

                    <SummaryCard
                        title="Total Reviews"
                        value={totalReviews}
                        description="All time"
                        icon="fas fa-users"
                        iconClass="bg-purple-50 text-indigo-600"
                    />

                    <SummaryCard
                        title="Completed Reviews"
                        value={completedReviews}
                        description={
                            totalReviews
                                ? `${(
                                      (completedReviews /
                                          totalReviews) *
                                      100
                                  ).toFixed(2)}% of total`
                                : "0% of total"
                        }
                        icon="fas fa-check-circle"
                        iconClass="bg-green-50 text-green-600"
                    />

                    <SummaryCard
                        title="Average Rating"
                        value={averageRating}
                        description="Out of 5"
                        icon="fas fa-star"
                        iconClass="bg-blue-50 text-blue-600"
                    />

                </div>

                {/* TABLE */}

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                    {/* FILTERS */}

                    <div className="p-5 border-b border-gray-100">

                        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr_auto] gap-3">

                            <div className="relative">

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(
                                            e.target.value
                                        );
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Search employee..."
                                    className="performance-input pr-10"
                                />

                                <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />

                            </div>

                            <div className="relative">

                                <select
                                    value={
                                        departmentFilter
                                    }
                                    onChange={(e) => {
                                        setDepartmentFilter(
                                            e.target.value
                                        );
                                        setCurrentPage(1);
                                    }}
                                    className="performance-input appearance-none pr-10"
                                >

                                    <option value="">
                                        All Departments
                                    </option>

                                    {departments.map(
                                        (department) => (
                                            <option
                                                key={
                                                    department._id
                                                }
                                                value={
                                                    department._id
                                                }
                                            >
                                                {department.name ||
                                                    department.departmentName}
                                            </option>
                                        )
                                    )}

                                </select>

                                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />

                            </div>

                            <div className="relative">

                                <select
                                    value={
                                        periodFilter
                                    }
                                    onChange={(e) => {
                                        setPeriodFilter(
                                            e.target.value
                                        );
                                        setCurrentPage(1);
                                    }}
                                    className="performance-input appearance-none pr-10"
                                >

                                    <option value="">
                                        All Periods
                                    </option>

                                    {availablePeriods.map(
                                        (period) => (
                                            <option
                                                key={period}
                                                value={period}
                                            >
                                                {formatPeriod(
                                                    period
                                                )}
                                            </option>
                                        )
                                    )}

                                </select>

                                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />

                            </div>

                            <button
                                type="button"
                                onClick={clearFilters}
                                className="h-11 px-5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-rotate-left" />
                                Reset
                            </button>

                        </div>

                    </div>

                    {/* TABLE */}

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[900px] text-sm">

                            <thead className="bg-gray-50 border-b border-gray-100">

                                <tr className="text-left text-xs font-semibold text-gray-500">

                                    <th className="px-6 py-4">
                                        Employee
                                    </th>

                                    <th className="px-6 py-4">
                                        Department
                                    </th>

                                    <th className="px-6 py-4">
                                        Review Month
                                    </th>

                                    <th className="px-6 py-4 text-center">
                                        Rating
                                    </th>

                                    <th className="px-6 py-4 text-center">
                                        Actions
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="px-6 py-12 text-center text-gray-400"
                                        >
                                            <i className="fas fa-spinner fa-spin mr-2" />
                                            Loading performance reviews...
                                        </td>
                                    </tr>
                                ) : paginatedReviews.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="px-6 py-12 text-center"
                                        >

                                            <div className="text-gray-400 mb-2">
                                                <i className="fas fa-chart-line text-2xl" />
                                            </div>

                                            <p className="text-sm font-medium text-gray-600">
                                                No performance reviews found
                                            </p>

                                            <p className="text-xs text-gray-400 mt-1">
                                                Try changing the filters or add a new review.
                                            </p>

                                        </td>
                                    </tr>
                                ) : (
                                    paginatedReviews.map(
                                        (review) => (
                                            <tr
                                                key={
                                                    review._id
                                                }
                                                className="hover:bg-gray-50/70 transition-colors"
                                            >

                                                <td className="px-6 py-4">

                                                    <div className="flex items-center gap-3">

                                                        <Avatar
                                                            employee={getEmployee(
                                                                review
                                                            )}
                                                        />

                                                        <div>

                                                            <p className="font-medium text-gray-800">
                                                                {getEmployeeName(
                                                                    review
                                                                )}
                                                            </p>

                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {getEmployeeDesignation(
                                                                    review
                                                                )}
                                                            </p>

                                                        </div>

                                                    </div>

                                                </td>

                                                <td className="px-6 py-4 text-gray-700">
                                                    {getDepartmentName(
                                                        review
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-gray-700">
                                                    {formatPeriod(
                                                        review.reviewPeriod
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-center">

                                                    <span className="font-semibold text-gray-800">
                                                        {
                                                            review.rating
                                                        }
                                                    </span>

                                                </td>

                                                <td className="px-6 py-4">

                                                    <div className="flex items-center justify-center gap-2">

                                                        <ActionButton
                                                            title="View Review"
                                                            icon="fas fa-eye"
                                                            onClick={() =>
                                                                openDetails(
                                                                    review
                                                                )
                                                            }
                                                        />

                                                        <ActionButton
                                                            title="Edit Review"
                                                            icon="fas fa-pen"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    review
                                                                )
                                                            }
                                                        />

                                                        <ActionButton
                                                            title="Delete Review"
                                                            icon="fas fa-trash"
                                                            danger
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    review
                                                                )
                                                            }
                                                        />

                                                    </div>

                                                </td>

                                            </tr>
                                        )
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                    {/* PAGINATION */}

                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">

                        <p className="text-sm text-gray-500">

                            Showing{" "}
                            {filteredReviews.length ===
                            0
                                ? 0
                                : (currentPage - 1) *
                                      PAGE_SIZE +
                                  1}{" "}
                            to{" "}
                            {Math.min(
                                currentPage *
                                    PAGE_SIZE,
                                filteredReviews.length
                            )}{" "}
                            of{" "}
                            {filteredReviews.length}{" "}
                            entries

                        </p>

                        <div className="flex items-center gap-1.5">

                            <button
                                type="button"
                                disabled={
                                    currentPage <=
                                    1
                                }
                                onClick={() =>
                                    setCurrentPage(
                                        (page) =>
                                            page - 1
                                    )
                                }
                                className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                <i className="fas fa-chevron-left text-xs" />
                            </button>

                            {Array.from(
                                {
                                    length: totalPages
                                },
                                (_, index) =>
                                    index + 1
                            )
                                .filter(
                                    (page) =>
                                        page <= 3 ||
                                        page ===
                                            totalPages ||
                                        Math.abs(
                                            page -
                                                currentPage
                                        ) <= 1
                                )
                                .map(
                                    (
                                        page,
                                        index,
                                        pages
                                    ) => {

                                        const previous =
                                            pages[
                                                index - 1
                                            ];

                                        const showEllipsis =
                                            previous &&
                                            page -
                                                previous >
                                                1;

                                        return (
                                            <div
                                                key={
                                                    page
                                                }
                                                className="flex items-center gap-1.5"
                                            >

                                                {showEllipsis && (
                                                    <span className="px-1 text-gray-400">
                                                        ...
                                                    </span>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setCurrentPage(
                                                            page
                                                        )
                                                    }
                                                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                                                        currentPage ===
                                                        page
                                                            ? "bg-indigo-600 text-white"
                                                            : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {
                                                        page
                                                    }
                                                </button>

                                            </div>
                                        );
                                    }
                                )}

                            <button
                                type="button"
                                disabled={
                                    currentPage >=
                                    totalPages
                                }
                                onClick={() =>
                                    setCurrentPage(
                                        (page) =>
                                            page + 1
                                    )
                                }
                                className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                <i className="fas fa-chevron-right text-xs" />
                            </button>

                        </div>

                    </div>

                </div>

            </div>

            {/* =========================
                REVIEW DETAILS PANEL
            ========================== */}

            {selectedReview && (
                <div
                    className={`fixed inset-0 z-50 ${
                        detailsVisible
                            ? "pointer-events-auto"
                            : "pointer-events-none"
                    }`}
                >

                    <div
                        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
                            detailsVisible
                                ? "opacity-100"
                                : "opacity-0"
                        }`}
                        onClick={closeDetails}
                    />

                    <aside
                        className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col ${
                            detailsVisible
                                ? "performance-panel"
                                : "translate-x-full"
                        }`}
                    >

                        {/* HEADER */}

                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">

                            <h2 className="text-lg font-semibold text-gray-900">
                                Review Details
                            </h2>

                            <button
                                type="button"
                                onClick={closeDetails}
                                className="w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                                <i className="fas fa-xmark" />
                            </button>

                        </div>

                        {/* CONTENT */}

                        <div className="flex-1 overflow-y-auto px-6 py-6">

                            {/* EMPLOYEE */}

                            <div className="flex items-center gap-3 pb-5 border-b border-gray-100">

                                <Avatar
                                    employee={getEmployee(
                                        selectedReview
                                    )}
                                    large
                                />

                                <div>

                                    <p className="font-semibold text-gray-900">
                                        {getEmployeeName(
                                            selectedReview
                                        )}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        {getEmployeeDesignation(
                                            selectedReview
                                        )}
                                    </p>

                                </div>

                            </div>

                            {/* INFORMATION */}

                            <div className="py-5 border-b border-gray-100 space-y-4">

                                <DetailRow
                                    label="Department"
                                    value={getDepartmentName(
                                        selectedReview
                                    )}
                                />

                                <DetailRow
                                    label="Reviewer"
                                    value={getReviewerName()}
                                />

                                <DetailRow
                                    label="Review Month"
                                    value={formatPeriod(
                                        selectedReview.reviewPeriod
                                    )}
                                />

                                <DetailRow
                                    label="Rating"
                                    value={
                                        <span className="font-semibold text-gray-900">
                                            {
                                                selectedReview.rating
                                            }{" "}
                                            / 5
                                        </span>
                                    }
                                />

                                <DetailRow
                                    label="Review Date"
                                    value={formatDate(
                                        selectedReview.createdAt
                                    )}
                                />

                                <DetailRow
                                    label="Reviewed By"
                                    value={getReviewerName()}
                                />

                            </div>

                            {/* COMMENTS */}

                            <div className="py-5 border-b border-gray-100">

                                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                    Comments
                                </h3>

                                <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-4">

                                    <i className="fas fa-quote-left text-indigo-500 text-sm mb-2" />

                                    <p className="text-sm text-gray-600 leading-6">
                                        {selectedReview.feedback ||
                                            "No comments provided."}
                                    </p>

                                </div>

                            </div>

                            {/* STRENGTHS */}

                            <div className="py-5 border-b border-gray-100">

                                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                    Strengths
                                </h3>

                                {selectedReview.strengths ? (
                                    <div className="space-y-2">

                                        {selectedReview.strengths
                                            .split(
                                                "\n"
                                            )
                                            .filter(
                                                Boolean
                                            )
                                            .map(
                                                (
                                                    strength,
                                                    index
                                                ) => (
                                                    <div
                                                        key={
                                                            index
                                                        }
                                                        className="flex items-start gap-2 text-sm text-gray-600"
                                                    >
                                                        <i className="fas fa-circle-check text-indigo-600 mt-0.5 text-xs" />

                                                        <span>
                                                            {
                                                                strength
                                                            }
                                                        </span>

                                                    </div>
                                                )
                                            )}

                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">
                                        No strengths provided.
                                    </p>
                                )}

                            </div>

                            {/* IMPROVEMENT */}

                            <div className="py-5 border-b border-gray-100">

                                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                    Areas for Improvement
                                </h3>

                                {selectedReview.areasOfImprovement ? (
                                    <div className="space-y-2">

                                        {selectedReview.areasOfImprovement
                                            .split(
                                                "\n"
                                            )
                                            .filter(
                                                Boolean
                                            )
                                            .map(
                                                (
                                                    area,
                                                    index
                                                ) => (
                                                    <div
                                                        key={
                                                            index
                                                        }
                                                        className="flex items-start gap-2 text-sm text-gray-600"
                                                    >
                                                        <i className="fas fa-circle text-orange-400 mt-1 text-[7px]" />

                                                        <span>
                                                            {
                                                                area
                                                            }
                                                        </span>

                                                    </div>
                                                )
                                            )}

                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">
                                        No improvement areas provided.
                                    </p>
                                )}

                            </div>

                            {/* GOALS */}

                            <div className="py-5">

                                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                    Goals
                                </h3>

                                <p className="text-sm text-gray-600 leading-6 whitespace-pre-line">
                                    {selectedReview.goals ||
                                        "No goals provided."}
                                </p>

                            </div>

                        </div>

                        {/* FOOTER */}

                        <div className="border-t border-gray-100 p-5 flex items-center gap-3 flex-shrink-0">

                            <button
                                type="button"
                                onClick={() =>
                                    openEditModal(
                                        selectedReview
                                    )
                                }
                                className="flex-1 h-11 rounded-lg border border-gray-200 text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-pen" />
                                Edit Review
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    openDeleteModal(
                                        selectedReview
                                    )
                                }
                                className="flex-1 h-11 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-trash" />
                                Delete Review
                            </button>

                        </div>

                    </aside>

                </div>
            )}

            {/* =========================
                ADD REVIEW MODAL
            ========================== */}

            {showAddModal && (
                <ModalBackdrop>

                    <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl performance-modal-in max-h-[90vh] flex flex-col">

                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">

                            <h2 className="text-lg font-semibold text-gray-900">
                                Add Review
                            </h2>

                            <button
                                type="button"
                                onClick={closeAddModal}
                                disabled={saving}
                                className="w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                            >
                                <i className="fas fa-xmark" />
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleCreateReview
                            }
                            className="flex-1 overflow-y-auto"
                        >

                            <div className="p-6 space-y-5">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <FormField
                                        label="Employee"
                                        required
                                    >

                                        <select
                                            name="employeeId"
                                            value={
                                                reviewForm.employeeId
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            required
                                            className="performance-input"
                                        >

                                            <option value="">
                                                Select Employee
                                            </option>

                                            {employees.map(
                                                (
                                                    employee
                                                ) => (
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
                                                        }
                                                    </option>
                                                )
                                            )}

                                        </select>

                                    </FormField>

                                    <FormField label="Department">

                                        <input
                                            type="text"
                                            value={
                                                selectedDepartmentName ||
                                                "Select employee first"
                                            }
                                            readOnly
                                            className="performance-input bg-gray-50 text-gray-500"
                                        />

                                    </FormField>

                                    <FormField
                                        label="Review Month"
                                        required
                                    >

                                        <input
                                            type="month"
                                            name="reviewPeriod"
                                            value={
                                                reviewForm.reviewPeriod
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            required
                                            className="performance-input"
                                        />

                                    </FormField>

                                    <FormField
                                        label="Rating"
                                        required
                                    >

                                        <div className="relative">

                                            <select
                                                name="rating"
                                                value={
                                                    reviewForm.rating
                                                }
                                                onChange={
                                                    handleFormChange
                                                }
                                                required
                                                className="performance-input appearance-none pr-10"
                                            >

                                                <option value="">
                                                    Select Rating (1-5)
                                                </option>

                                                <option value="5">
                                                    5 - Excellent
                                                </option>

                                                <option value="4">
                                                    4 - Very Good
                                                </option>

                                                <option value="3">
                                                    3 - Good
                                                </option>

                                                <option value="2">
                                                    2 - Needs Improvement
                                                </option>

                                                <option value="1">
                                                    1 - Poor
                                                </option>

                                            </select>

                                            <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />

                                        </div>

                                    </FormField>

                                </div>

                                <FormField label="Strengths">

                                    <textarea
                                        name="strengths"
                                        value={
                                            reviewForm.strengths
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        rows="3"
                                        placeholder="Enter employee strengths..."
                                        className="performance-input resize-none"
                                    />

                                </FormField>

                                <FormField label="Areas for Improvement">

                                    <textarea
                                        name="areasOfImprovement"
                                        value={
                                            reviewForm.areasOfImprovement
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        rows="3"
                                        placeholder="Enter areas for improvement..."
                                        className="performance-input resize-none"
                                    />

                                </FormField>

                                <FormField
                                    label="Comments"
                                    required
                                >

                                    <textarea
                                        name="feedback"
                                        value={
                                            reviewForm.feedback
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        rows="4"
                                        maxLength="300"
                                        required
                                        placeholder="Enter your feedback and comments..."
                                        className="performance-input resize-none"
                                    />

                                    <div className="text-right text-[11px] text-gray-400 mt-1">

                                        {
                                            reviewForm
                                                .feedback
                                                .length
                                        }{" "}
                                        / 300

                                    </div>

                                </FormField>

                                <FormField label="Goals">

                                    <textarea
                                        name="goals"
                                        value={
                                            reviewForm.goals
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        rows="3"
                                        placeholder="Enter goals for the employee..."
                                        className="performance-input resize-none"
                                    />

                                </FormField>

                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">

                                <button
                                    type="button"
                                    onClick={
                                        closeAddModal
                                    }
                                    disabled={saving}
                                    className="h-11 px-5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="h-11 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-60 flex items-center gap-2"
                                >

                                    {saving ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-pen" />
                                            Save Review
                                        </>
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </ModalBackdrop>
            )}

            {/* =========================
                EDIT REVIEW MODAL
            ========================== */}

            {showEditModal && (
                <ModalBackdrop>

                    <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl performance-modal-in max-h-[90vh] flex flex-col">

                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">

                            <h2 className="text-lg font-semibold text-gray-900">
                                Edit Review
                            </h2>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowEditModal(
                                        false
                                    )
                                }
                                disabled={saving}
                                className="w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <i className="fas fa-xmark" />
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleUpdateReview
                            }
                            className="flex-1 overflow-y-auto"
                        >

                            <div className="p-6 space-y-5">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <FormField label="Employee">

                                        <input
                                            type="text"
                                            value={
                                                selectedReview
                                                    ? getEmployeeName(
                                                          selectedReview
                                                      )
                                                    : ""
                                            }
                                            readOnly
                                            className="performance-input bg-gray-50 text-gray-500"
                                        />

                                    </FormField>

                                    <FormField label="Department">

                                        <input
                                            type="text"
                                            value={
                                                selectedReview
                                                    ? getDepartmentName(
                                                          selectedReview
                                                      )
                                                    : ""
                                            }
                                            readOnly
                                            className="performance-input bg-gray-50 text-gray-500"
                                        />

                                    </FormField>

                                    <FormField label="Review Month">

                                        <input
                                            type="text"
                                            value={
                                                formatPeriod(
                                                    reviewForm.reviewPeriod
                                                )
                                            }
                                            readOnly
                                            className="performance-input bg-gray-50 text-gray-500"
                                        />

                                    </FormField>

                                    <FormField
                                        label="Rating"
                                        required
                                    >

                                        <div className="relative">

                                            <select
                                                name="rating"
                                                value={
                                                    reviewForm.rating
                                                }
                                                onChange={
                                                    handleFormChange
                                                }
                                                required
                                                className="performance-input appearance-none pr-10"
                                            >

                                                <option value="">
                                                    Select Rating (1-5)
                                                </option>

                                                <option value="5">
                                                    5 - Excellent
                                                </option>

                                                <option value="4">
                                                    4 - Very Good
                                                </option>

                                                <option value="3">
                                                    3 - Good
                                                </option>

                                                <option value="2">
                                                    2 - Needs Improvement
                                                </option>

                                                <option value="1">
                                                    1 - Poor
                                                </option>

                                            </select>

                                            <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />

                                        </div>

                                    </FormField>

                                </div>

                                <FormField label="Strengths">

                                    <textarea
                                        name="strengths"
                                        value={
                                            reviewForm.strengths
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        rows="3"
                                        className="performance-input resize-none"
                                    />

                                </FormField>

                                <FormField label="Areas for Improvement">

                                    <textarea
                                        name="areasOfImprovement"
                                        value={
                                            reviewForm.areasOfImprovement
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        rows="3"
                                        className="performance-input resize-none"
                                    />

                                </FormField>

                                <FormField
                                    label="Comments"
                                    required
                                >

                                    <textarea
                                        name="feedback"
                                        value={
                                            reviewForm.feedback
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        rows="4"
                                        maxLength="300"
                                        required
                                        className="performance-input resize-none"
                                    />

                                    <div className="text-right text-[11px] text-gray-400 mt-1">

                                        {
                                            reviewForm
                                                .feedback
                                                .length
                                        }{" "}
                                        / 300

                                    </div>

                                </FormField>

                                <FormField label="Goals">

                                    <textarea
                                        name="goals"
                                        value={
                                            reviewForm.goals
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        rows="3"
                                        className="performance-input resize-none"
                                    />

                                </FormField>

                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowEditModal(
                                            false
                                        )
                                    }
                                    disabled={saving}
                                    className="h-11 px-5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="h-11 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-60 flex items-center gap-2"
                                >

                                    {saving ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-pen" />
                                            Update Review
                                        </>
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </ModalBackdrop>
            )}

            {/* =========================
                DELETE MODAL
            ========================== */}

            {reviewToDelete && (
                <ModalBackdrop>

                    <div className="w-full max-w-md bg-white rounded-xl shadow-2xl performance-modal-in">

                        <div className="p-6">

                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto mb-4">
                                <i className="fas fa-trash" />
                            </div>

                            <h2 className="text-lg font-semibold text-gray-900 text-center">
                                Delete Review
                            </h2>

                            <p className="text-sm text-gray-500 text-center mt-2 leading-6 break-words">

                                Are you sure you want to delete the performance review for{" "}

                                <span className="font-medium text-gray-700">
                                    {getEmployeeName(
                                        reviewToDelete
                                    )}
                                </span>{" "}

                                for{" "}

                                <span className="font-medium text-gray-700">
                                    {formatPeriod(
                                        reviewToDelete.reviewPeriod
                                    )}
                                </span>
                                ?

                            </p>

                            <div className="flex justify-end gap-3 mt-6">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setReviewToDelete(
                                            null
                                        )
                                    }
                                    disabled={deleting}
                                    className="h-11 px-5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleDeleteReview
                                    }
                                    disabled={deleting}
                                    className="h-11 px-5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-60 flex items-center gap-2"
                                >

                                    {deleting ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-trash" />
                                            Delete Review
                                        </>
                                    )}

                                </button>

                            </div>

                        </div>

                    </div>

                </ModalBackdrop>
            )}

            {/* =========================
                TOAST
            ========================== */}

            {toast && (
                <div className="fixed top-5 right-5 z-[100] performance-toast">

                    <div
                        className={`min-w-[320px] max-w-md bg-white border rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 ${
                            toast.type ===
                            "success"
                                ? "border-green-200"
                                : "border-red-200"
                        }`}
                    >

                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                toast.type ===
                                "success"
                                    ? "bg-green-50 text-green-600"
                                    : "bg-red-50 text-red-600"
                            }`}
                        >

                            <i
                                className={
                                    toast.type ===
                                    "success"
                                        ? "fas fa-check"
                                        : "fas fa-xmark"
                                }
                            />

                        </div>

                        <div className="flex-1 pt-1">

                            <p className="text-sm font-medium text-gray-800">
                                {toast.message}
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setToast(null)
                            }
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <i className="fas fa-xmark text-xs" />
                        </button>

                    </div>

                </div>
            )}

        </>
    );
}

// =====================================================
// COMPONENTS
// =====================================================

function SummaryCard({
    title,
    value,
    description,
    icon,
    iconClass
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5">

            <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconClass}`}
            >
                <i className={`${icon} text-lg`} />
            </div>

            <p className="text-xl font-bold text-gray-900">
                {value}
            </p>

            <p className="text-sm font-medium text-gray-700 mt-1">
                {title}
            </p>

            <p className="text-xs text-gray-500 mt-1">
                {description}
            </p>

        </div>
    );
}

function Avatar({
    employee,
    large = false
}) {
    const imagePath =
        employee?.profileImage ||
        employee?.image;

    const fullName = `${employee?.firstName || ""} ${
        employee?.lastName || ""
    }`.trim();

    const initials =
        fullName
            .split(" ")
            .filter(Boolean)
            .map(
                (part) =>
                    part[0]?.toUpperCase()
            )
            .join("")
            .slice(0, 2) || "E";

    const apiBase =
        api.defaults.baseURL || "";

    const imageUrl =
        imagePath &&
        `${apiBase.replace(
            /\/api\/?$/,
            ""
        )}/${String(
            imagePath
        ).replace(/^\/+/, "")}`;

    return (
        <div
            className={`${
                large
                    ? "w-12 h-12"
                    : "w-9 h-9"
            } rounded-full overflow-hidden bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 font-semibold ${
                large
                    ? "text-sm"
                    : "text-xs"
            }`}
        >

            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.currentTarget.style.display =
                            "none";
                    }}
                />
            ) : (
                initials
            )}

        </div>
    );
}

function ActionButton({
    icon,
    title,
    onClick,
    danger = false
}) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
                danger
                    ? "border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200"
                    : "border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200"
            }`}
        >
            <i className={`${icon} text-sm`} />
        </button>
    );
}

function DetailRow({
    label,
    value
}) {
    return (
        <div className="flex items-start justify-between gap-5 text-sm">

            <span className="font-medium text-gray-700">
                {label}
            </span>

            <span className="text-gray-600 text-right">
                {value}
            </span>

        </div>
    );
}

function FormField({
    label,
    required = false,
    children
}) {
    return (
        <div>

            <label className="block text-sm font-medium text-gray-700 mb-1.5">

                {label}{" "}

                {required && (
                    <span className="text-red-500">
                        *
                    </span>
                )}

            </label>

            {children}

        </div>
    );
}

function ModalBackdrop({
    children
}) {
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">

            <div className="absolute inset-0 bg-black/30 performance-backdrop" />

            <div className="relative z-10 w-full flex justify-center">
                {children}
            </div>

        </div>
    );
}

export default PerformanceManagement;