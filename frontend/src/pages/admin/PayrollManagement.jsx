import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faEye,
    faCheck,
    faTrash,
    faXmark,
    faChevronDown,
    faCircleCheck,
    faCircleExclamation,
    faIndianRupeeSign
} from "@fortawesome/free-solid-svg-icons";

function PayrollManagement() {
    const [payrolls, setPayrolls] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedPayroll, setSelectedPayroll] = useState(null);

    const [showAddPayrollModal, setShowAddPayrollModal] = useState(false);
    const [isCreatingPayroll, setIsCreatingPayroll] = useState(false);

    const [showPaidModal, setShowPaidModal] = useState(false);
    const [payrollToMarkPaid, setPayrollToMarkPaid] = useState(null);
    const [isMarkingPaid, setIsMarkingPaid] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [payrollToDelete, setPayrollToDelete] = useState(null);
    const [isDeletingPayroll, setIsDeletingPayroll] = useState(false);

    const [toast, setToast] = useState(null);

    const [payrollForm, setPayrollForm] = useState({
        employeeId: "",
        month: String(new Date().getMonth() + 1),
        year: String(new Date().getFullYear()),
        basicSalary: "",
        allowances: "",
        deductions: ""
    });

    // =========================
    // FILTERS
    // =========================

    const [monthFilter, setMonthFilter] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // =========================
    // CUSTOM DROPDOWN STATES
    // =========================

    const [monthOpen, setMonthOpen] = useState(false);
    const [departmentOpen, setDepartmentOpen] = useState(false);

    // =========================
    // MONTHS
    // =========================

    const months = [
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" }
    ];

    // =========================
    // TOAST
    // =========================

    const showToast = (message, type = "success") => {
        setToast({
            id: Date.now(),
            message,
            type
        });
    };

    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => {
            setToast(null);
        }, 3500);

        return () => clearTimeout(timer);
    }, [toast]);

    // =========================
    // FETCH DATA
    // =========================

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                payrollResponse,
                departmentResponse,
                employeeResponse
            ] = await Promise.all([
                api.get("/payroll"),
                api.get("/departments"),
                api.get("/employees")
            ]);

            setPayrolls(payrollResponse.data.payrolls || []);

            setDepartments(
                departmentResponse.data.departments || []
            );

            setEmployees(
                employeeResponse.data.employees || []
            );
        } catch (err) {
            console.error(
                "Fetch payroll data error:",
                err
            );

            const message =
                err.response?.data?.message ||
                "Failed to fetch payroll data.";

            setError(message);
            showToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // =========================
    // HELPER FUNCTIONS
    // =========================

    const getEmployeeName = (payroll) => {
        if (!payroll.employeeId) {
            return "Unknown Employee";
        }

        return `${payroll.employeeId.firstName || ""} ${
            payroll.employeeId.lastName || ""
        }`.trim();
    };

    const getEmployeeCode = (payroll) => {
        return payroll.employeeId?.employeeCode || "-";
    };

    const getDepartmentId = (payroll) => {
        const department =
            payroll.employeeId?.departmentId;

        if (!department) {
            return "";
        }

        if (typeof department === "object") {
            return department._id || "";
        }

        return department;
    };

    const getDepartmentName = (payroll) => {
        const department =
            payroll.employeeId?.departmentId;

        if (!department) {
            return "Not Assigned";
        }

        if (typeof department === "object") {
            return department.name || "Not Assigned";
        }

        const matchedDepartment =
            departments.find(
                (item) => item._id === department
            );

        return (
            matchedDepartment?.name ||
            "Not Assigned"
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

    const getMonthName = (month) => {
        const foundMonth = months.find(
            (item) =>
                item.value === String(month)
        );

        return foundMonth?.label || "-";
    };

    const formatMonth = (month, year) => {
        if (!month || !year) return "-";

        return `${getMonthName(month)} ${year}`;
    };

    // =========================
    // FILTERED PAYROLL
    // =========================

    const filteredPayrolls = useMemo(() => {
        return payrolls.filter((payroll) => {
            const employeeName =
                getEmployeeName(
                    payroll
                ).toLowerCase();

            const employeeCode =
                getEmployeeCode(
                    payroll
                ).toLowerCase();

            const payrollDepartmentId =
                getDepartmentId(payroll);

            const matchesEmployee =
                !employeeSearch ||
                employeeName.includes(
                    employeeSearch.toLowerCase()
                ) ||
                employeeCode.includes(
                    employeeSearch.toLowerCase()
                );

            const matchesDepartment =
                !departmentFilter ||
                payrollDepartmentId ===
                    departmentFilter;

            const matchesStatus =
                !statusFilter ||
                payroll.paymentStatus ===
                    statusFilter;

            const matchesMonth =
                !monthFilter ||
                String(payroll.month) ===
                    String(monthFilter);

            return (
                matchesEmployee &&
                matchesDepartment &&
                matchesStatus &&
                matchesMonth
            );
        });
    }, [
        payrolls,
        departments,
        employeeSearch,
        departmentFilter,
        statusFilter,
        monthFilter
    ]);

    const payrollsForTotal = useMemo(() => {
    return payrolls.filter((payroll) => {
        const employeeName =
            getEmployeeName(
                payroll
            ).toLowerCase();

        const employeeCode =
            getEmployeeCode(
                payroll
            ).toLowerCase();

        const payrollDepartmentId =
            getDepartmentId(payroll);

        const matchesEmployee =
            !employeeSearch ||
            employeeName.includes(
                employeeSearch.toLowerCase()
            ) ||
            employeeCode.includes(
                employeeSearch.toLowerCase()
            );

        const matchesDepartment =
            !departmentFilter ||
            payrollDepartmentId ===
                departmentFilter;

        const matchesMonth =
            !monthFilter ||
            String(payroll.month) ===
                String(monthFilter);

        return (
            matchesEmployee &&
            matchesDepartment &&
            matchesMonth
        );
    });
}, [
    payrolls,
    departments,
    employeeSearch,
    departmentFilter,
    monthFilter
]);

    // =========================
    // CREATE PAYROLL
    // =========================

    const handleCreatePayroll = async (e) => {
        e.preventDefault();

        if (!payrollForm.employeeId) {
            showToast(
                "Please select an employee.",
                "error"
            );
            return;
        }

        if (
            !payrollForm.basicSalary ||
            Number(payrollForm.basicSalary) < 0
        ) {
            showToast(
                "Please enter a valid basic salary.",
                "error"
            );
            return;
        }

        try {
            setIsCreatingPayroll(true);

            const response = await api.post(
                "/payroll",
                {
                    employeeId:
                        payrollForm.employeeId,

                    month:
                        Number(
                            payrollForm.month
                        ),

                    year:
                        Number(
                            payrollForm.year
                        ),

                    basicSalary:
                        Number(
                            payrollForm.basicSalary
                        ),

                    allowances:
                        Number(
                            payrollForm.allowances || 0
                        ),

                    deductions:
                        Number(
                            payrollForm.deductions || 0
                        )
                }
            );

            setPayrollForm({
                employeeId: "",
                month: String(
                    new Date().getMonth() + 1
                ),
                year: String(
                    new Date().getFullYear()
                ),
                basicSalary: "",
                allowances: "",
                deductions: ""
            });

            setShowAddPayrollModal(false);

            await fetchData();

            showToast(
                response.data.message ||
                    "Payroll created successfully.",
                "success"
            );
        } catch (err) {
            console.error(
                "Create payroll error:",
                err
            );

            showToast(
                err.response?.data?.message ||
                    "Failed to create payroll.",
                "error"
            );
        } finally {
            setIsCreatingPayroll(false);
        }
    };

    // =========================
    // MARK PAYROLL AS PAID
    // =========================

    const handleMarkAsPaid = (payrollId) => {
        const payroll = payrolls.find(
            (item) => item._id === payrollId
        );

        if (!payroll) {
            return;
        }

        setPayrollToMarkPaid(payroll);
        setShowPaidModal(true);
    };

    const confirmMarkAsPaid = async () => {
        if (!payrollToMarkPaid) {
            return;
        }

        try {
            setIsMarkingPaid(true);

            const response = await api.patch(
                `/payroll/${payrollToMarkPaid._id}/paid`
            );

            const updatedPayroll =
                response.data.payroll;

            setPayrolls((currentPayrolls) =>
                currentPayrolls.map((payroll) =>
                    payroll._id ===
                    payrollToMarkPaid._id
                        ? {
                              ...payroll,
                              paymentStatus:
                                  updatedPayroll.paymentStatus,
                              paidDate:
                                  updatedPayroll.paidDate
                          }
                        : payroll
                )
            );

            setSelectedPayroll((currentPayroll) =>
                currentPayroll?._id ===
                payrollToMarkPaid._id
                    ? {
                          ...currentPayroll,
                          paymentStatus:
                              updatedPayroll.paymentStatus,
                          paidDate:
                              updatedPayroll.paidDate
                      }
                    : currentPayroll
            );

            setShowPaidModal(false);
            setPayrollToMarkPaid(null);

            showToast(
                response.data.message ||
                    "Payroll marked as paid successfully.",
                "success"
            );
        } catch (err) {
            console.error(
                "Mark payroll as paid error:",
                err
            );

            showToast(
                err.response?.data?.message ||
                    "Failed to mark payroll as paid.",
                "error"
            );
        } finally {
            setIsMarkingPaid(false);
        }
    };

    // =========================
    // DELETE PAYROLL
    // =========================

    const handleDeletePayroll = (payrollId) => {
        const payroll = payrolls.find(
            (item) => item._id === payrollId
        );

        if (!payroll) {
            return;
        }

        setPayrollToDelete(payroll);
        setShowDeleteModal(true);
    };

    const confirmDeletePayroll = async () => {
        if (!payrollToDelete) {
            return;
        }

        try {
            setIsDeletingPayroll(true);

            const response = await api.delete(
                `/payroll/${payrollToDelete._id}`
            );

            setPayrolls((currentPayrolls) =>
                currentPayrolls.filter(
                    (payroll) =>
                        payroll._id !==
                        payrollToDelete._id
                )
            );

            setSelectedPayroll((currentPayroll) =>
                currentPayroll?._id ===
                payrollToDelete._id
                    ? null
                    : currentPayroll
            );

            setShowDeleteModal(false);
            setPayrollToDelete(null);

            showToast(
                response.data.message ||
                    "Payroll deleted successfully.",
                "success"
            );
        } catch (err) {
            console.error(
                "Delete payroll error:",
                err
            );

            showToast(
                err.response?.data?.message ||
                    "Failed to delete payroll.",
                "error"
            );
        } finally {
            setIsDeletingPayroll(false);
        }
    };

    // =========================
    // SUMMARY
    // =========================

    const totalPayroll = payrollsForTotal.reduce(
    (total, payroll) => total + Number(payroll.netSalary || 0),
    0
);

    const paidEmployees =
        filteredPayrolls.filter(
            (payroll) =>
                payroll.paymentStatus ===
                "Paid"
        ).length;

    const pendingPayments =
        filteredPayrolls.filter(
            (payroll) =>
                payroll.paymentStatus ===
                "Pending"
        ).length;

    const totalAmountPaid =
        filteredPayrolls
            .filter(
                (payroll) =>
                    payroll.paymentStatus ===
                    "Paid"
            )
            .reduce(
                (total, payroll) =>
                    total +
                    Number(
                        payroll.netSalary || 0
                    ),
                0
            );

    // =========================
    // CLEAR FILTERS
    // =========================

    const clearFilters = () => {
        setMonthFilter("");
        setDepartmentFilter("");
        setEmployeeSearch("");
        setStatusFilter("");

        setMonthOpen(false);
        setDepartmentOpen(false);
    };

    // =========================
    // LOADING
    // =========================

    if (loading) {
        return (
            <p className="text-gray-500">
                Loading payroll records...
            </p>
        );
    }

    // =========================
    // ERROR
    // =========================

    if (error) {
        return (
            <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* =========================
                TOAST
            ========================== */}

            {toast && (
                <div className="fixed top-5 right-5 z-[100]">
                    <div
                        className={`min-w-[320px] max-w-md bg-white border rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 ${
                            toast.type === "success"
                                ? "border-green-200"
                                : "border-red-200"
                        }`}
                    >
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                toast.type === "success"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-red-100 text-red-600"
                            }`}
                        >
                            <FontAwesomeIcon
                                icon={
                                    toast.type === "success"
                                        ? faCircleCheck
                                        : faCircleExclamation
                                }
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p
                                className={`text-sm font-semibold ${
                                    toast.type === "success"
                                        ? "text-green-800"
                                        : "text-red-800"
                                }`}
                            >
                                {toast.type === "success"
                                    ? "Success"
                                    : "Error"}
                            </p>

                            <p className="text-sm text-gray-600 mt-0.5">
                                {toast.message}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setToast(null)
                            }
                            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition shrink-0"
                            aria-label="Close notification"
                            title="Close"
                        >
                            <FontAwesomeIcon
                                icon={faXmark}
                            />
                        </button>
                    </div>
                </div>
            )}

            {/* =========================
                PAGE HEADER
            ========================== */}

            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm mb-2">
                            <span className="text-indigo-600">
                                Dashboard
                            </span>

                            <FontAwesomeIcon
                                icon={faChevronDown}
                                className="text-[10px] text-gray-400 -rotate-90"
                            />

                            <span className="text-gray-700">
                                Payroll Management
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900">
                            Payroll Management
                        </h1>

                        <p className="text-sm text-gray-500 mt-1">
                            Manage employee payroll and payment records.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setShowAddPayrollModal(true)
                        }
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition inline-flex items-center gap-2"
                    >
                        <FontAwesomeIcon
                            icon={faPlus}
                            className="text-xs"
                        />
                        Add Payroll
                    </button>
                </div>
            </div>

            {/* =========================
                SUMMARY CARDS
            ========================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <SummaryCard
                    title="Total Payroll"
                    value={formatCurrency(totalPayroll)}
                    description="Current selection"
                    icon={faIndianRupeeSign}
                    iconClass="bg-indigo-50 text-indigo-600"
                />

                <SummaryCard
                    title="Paid Employees"
                    value={paidEmployees}
                    description="Paid payroll records"
                    icon={faCheck}
                    iconClass="bg-green-50 text-green-600"
                />

                <SummaryCard
                    title="Pending Payments"
                    value={pendingPayments}
                    description="Awaiting payment"
                    icon={faCircleExclamation}
                    iconClass="bg-orange-50 text-orange-600"
                />

                <SummaryCard
                    title="Total Amount Paid"
                    value={formatCurrency(totalAmountPaid)}
                    description="Paid payroll"
                    icon={faIndianRupeeSign}
                    iconClass="bg-blue-50 text-blue-600"
                />
            </div>

            {/* =========================
                FILTERS
            ========================== */}

            <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                    {/* MONTH */}

                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Month
                        </label>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();

                                setMonthOpen(
                                    !monthOpen
                                );

                                setDepartmentOpen(
                                    false
                                );
                            }}
                            className="w-full h-[46px] border border-gray-300 rounded-lg px-4 flex items-center justify-between bg-white text-sm text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <span>
                                {monthFilter
                                    ? getMonthName(
                                          monthFilter
                                      )
                                    : "All Months"}
                            </span>

                            <FontAwesomeIcon
                                icon={faChevronDown}
                                className={`text-xs text-gray-500 transition-transform ${
                                    monthOpen
                                        ? "rotate-180"
                                        : ""
                                }`}
                            />
                        </button>

                        {monthOpen && (
                            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-40 overflow-hidden max-h-72 overflow-y-auto">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMonthFilter("");
                                        setMonthOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 ${
                                        !monthFilter
                                            ? "bg-indigo-50 text-indigo-600 font-medium"
                                            : "text-gray-700"
                                    }`}
                                >
                                    All Months
                                </button>

                                {months.map(
                                    (month) => (
                                        <button
                                            type="button"
                                            key={
                                                month.value
                                            }
                                            onClick={() => {
                                                setMonthFilter(
                                                    month.value
                                                );

                                                setMonthOpen(
                                                    false
                                                );
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 ${
                                                String(
                                                    monthFilter
                                                ) ===
                                                String(
                                                    month.value
                                                )
                                                    ? "bg-indigo-50 text-indigo-600 font-medium"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            {
                                                month.label
                                            }
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    {/* DEPARTMENT */}

                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Department
                        </label>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();

                                setDepartmentOpen(
                                    !departmentOpen
                                );

                                setMonthOpen(false);
                            }}
                            className="w-full h-[46px] border border-gray-300 rounded-lg px-4 flex items-center justify-between bg-white text-sm text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <span>
                                {departmentFilter
                                    ? departments.find(
                                          (
                                              department
                                          ) =>
                                              department._id ===
                                              departmentFilter
                                      )?.name ||
                                      "All Departments"
                                    : "All Departments"}
                            </span>

                            <FontAwesomeIcon
                                icon={faChevronDown}
                                className={`text-xs text-gray-500 transition-transform ${
                                    departmentOpen
                                        ? "rotate-180"
                                        : ""
                                }`}
                            />
                        </button>

                        {departmentOpen && (
                            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-40 overflow-hidden max-h-72 overflow-y-auto">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDepartmentFilter(
                                            ""
                                        );

                                        setDepartmentOpen(
                                            false
                                        );
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 ${
                                        !departmentFilter
                                            ? "bg-indigo-50 text-indigo-600 font-medium"
                                            : "text-gray-700"
                                    }`}
                                >
                                    All Departments
                                </button>

                                {departments.map(
                                    (
                                        department
                                    ) => (
                                        <button
                                            type="button"
                                            key={
                                                department._id
                                            }
                                            onClick={() => {
                                                setDepartmentFilter(
                                                    department._id
                                                );

                                                setDepartmentOpen(
                                                    false
                                                );
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 ${
                                                departmentFilter ===
                                                department._id
                                                    ? "bg-indigo-50 text-indigo-600 font-medium"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            {
                                                department.name
                                            }
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    {/* EMPLOYEE */}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Employee
                        </label>

                        <input
                            type="text"
                            value={employeeSearch}
                            onChange={(e) =>
                                setEmployeeSearch(
                                    e.target.value
                                )
                            }
                            placeholder="Search employee..."
                            className="w-full h-[46px] border border-gray-300 rounded-lg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* PAYMENT STATUS */}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Status
                        </label>

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                            className="w-full h-[46px] border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">
                                All Statuses
                            </option>

                            <option value="Pending">
                                Pending
                            </option>

                            <option value="Paid">
                                Paid
                            </option>
                        </select>
                    </div>
                </div>

                {(monthFilter ||
                    departmentFilter ||
                    employeeSearch ||
                    statusFilter) && (
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            {/* =========================
                PAYROLL TABLE
            ========================== */}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Payroll Records
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                        {filteredPayrolls.length} payroll record
                        {filteredPayrolls.length !== 1
                            ? "s"
                            : ""}{" "}
                        found
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-sm table-fixed">
                        <colgroup>
                            <col className="w-[19%]" />
                            <col className="w-[13%]" />
                            <col className="w-[16%]" />
                            <col className="w-[14%]" />
                            <col className="w-[13%]" />
                            <col className="w-[13%]" />
                            <col className="w-[12%]" />
                        </colgroup>

                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-5 py-3 font-medium text-gray-600">
                                    Employee
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-600">
                                    Employee ID
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-600">
                                    Department
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-600">
                                    Basic Salary
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-600">
                                    Month
                                </th>

                                <th className="text-left px-5 py-3 font-medium text-gray-600">
                                    Payment Status
                                </th>

                                <th className="text-center px-3 py-3 font-medium text-gray-600">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {filteredPayrolls.length > 0 ? (
                                filteredPayrolls.map(
                                    (payroll) => (
                                        <tr
                                            key={
                                                payroll._id
                                            }
                                            className="hover:bg-gray-50 transition"
                                        >
                                            <td className="px-5 py-4 truncate">
                                                <p className="font-medium text-gray-900 truncate">
                                                    {getEmployeeName(
                                                        payroll
                                                    )}
                                                </p>

                                                <p className="text-xs text-gray-400 mt-1 truncate">
                                                    {payroll
                                                        .employeeId
                                                        ?.designation ||
                                                        "Employee"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 text-gray-600 truncate">
                                                {getEmployeeCode(
                                                    payroll
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-gray-600 truncate">
                                                {getDepartmentName(
                                                    payroll
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-gray-700 font-medium truncate">
                                                {formatCurrency(
                                                    payroll.basicSalary
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-gray-600 truncate">
                                                {formatMonth(
                                                    payroll.month,
                                                    payroll.year
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <PaymentStatusBadge
                                                    status={
                                                        payroll.paymentStatus
                                                    }
                                                />
                                            </td>

                                            {/* FIXED ACTION COLUMN */}

                                            <td className="px-3 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* VIEW */}

                                                    <button
                                                        type="button"
                                                        title="View payroll details"
                                                        aria-label="View payroll details"
                                                        onClick={() =>
                                                            setSelectedPayroll(
                                                                payroll
                                                            )
                                                        }
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={
                                                                faEye
                                                            }
                                                            className="text-sm"
                                                        />
                                                    </button>

                                                    {/* MARK AS PAID */}

                                                    {payroll.paymentStatus ===
                                                        "Pending" && (
                                                        <button
                                                            type="button"
                                                            title="Mark as Paid"
                                                            aria-label="Mark payroll as paid"
                                                            onClick={() =>
                                                                handleMarkAsPaid(
                                                                    payroll._id
                                                                )
                                                            }
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-50 transition"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={
                                                                    faCheck
                                                                }
                                                                className="text-sm"
                                                            />
                                                        </button>
                                                    )}

                                                    {/* DELETE */}

                                                    <button
                                                        type="button"
                                                        title="Delete payroll"
                                                        aria-label="Delete payroll"
                                                        onClick={() =>
                                                            handleDeletePayroll(
                                                                payroll._id
                                                            )
                                                        }
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50 transition"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={
                                                                faTrash
                                                            }
                                                            className="text-sm"
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )
                            ) : (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-5 py-10 text-center text-gray-500"
                                    >
                                        No payroll records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* =========================
                PAYROLL DETAILS PANEL
            ========================== */}

            {selectedPayroll && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={() =>
                            setSelectedPayroll(null)
                        }
                    />

                    <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Payroll Details
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Employee payroll information
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedPayroll(
                                        null
                                    )
                                }
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                                title="Close"
                                aria-label="Close payroll details"
                            >
                                <FontAwesomeIcon
                                    icon={faXmark}
                                />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-semibold">
                                    {getEmployeeName(
                                        selectedPayroll
                                    )
                                        .split(" ")
                                        .map(
                                            (
                                                name
                                            ) =>
                                                name.charAt(
                                                    0
                                                )
                                        )
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        {getEmployeeName(
                                            selectedPayroll
                                        )}
                                    </h3>

                                    <p className="text-sm text-gray-500">
                                        {getEmployeeCode(
                                            selectedPayroll
                                        )}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        {selectedPayroll
                                            .employeeId
                                            ?.designation ||
                                            "Employee"}{" "}
                                        ·{" "}
                                        {getDepartmentName(
                                            selectedPayroll
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-gray-200" />

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-4">
                                    Payroll Information
                                </h3>

                                <div className="space-y-4">
                                    <InfoRow
                                        label="Month"
                                        value={formatMonth(
                                            selectedPayroll.month,
                                            selectedPayroll.year
                                        )}
                                    />

                                    <InfoRow
                                        label="Payment Status"
                                        value={
                                            <PaymentStatusBadge
                                                status={
                                                    selectedPayroll.paymentStatus
                                                }
                                            />
                                        }
                                    />

                                    <InfoRow
                                        label="Payment Date"
                                        value={formatDate(
                                            selectedPayroll.paidDate
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-200" />

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-4">
                                    Salary Breakdown
                                </h3>

                                <div className="space-y-3">
                                    <MoneyRow
                                        label="Basic Salary"
                                        value={
                                            selectedPayroll.basicSalary
                                        }
                                    />

                                    <MoneyRow
                                        label="Allowances"
                                        value={
                                            selectedPayroll.allowances
                                        }
                                    />

                                    <MoneyRow
                                        label="Deductions"
                                        value={
                                            selectedPayroll.deductions
                                        }
                                    />

                                    <div className="border-t border-gray-200 pt-3">
                                        <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-4 py-3">
                                            <span className="font-semibold text-indigo-700">
                                                Net Salary
                                            </span>

                                            <span className="font-bold text-indigo-700">
                                                {formatCurrency(
                                                    selectedPayroll.netSalary
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedPayroll(
                                        null
                                    )
                                }
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================
                ADD PAYROLL MODAL
            ========================== */}

            {showAddPayrollModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Add Payroll
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Create payroll for an employee
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowAddPayrollModal(
                                        false
                                    )
                                }
                                disabled={
                                    isCreatingPayroll
                                }
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
                                title="Close"
                                aria-label="Close add payroll modal"
                            >
                                <FontAwesomeIcon
                                    icon={faXmark}
                                />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleCreatePayroll
                            }
                        >
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Employee
                                    </label>

                                    <select
                                        value={
                                            payrollForm.employeeId
                                        }
                                        onChange={(e) => {
                                            const selectedEmployee =
                                                employees.find(
                                                    (
                                                        employee
                                                    ) =>
                                                        employee._id ===
                                                        e
                                                            .target
                                                            .value
                                                );

                                            setPayrollForm({
                                                ...payrollForm,
                                                employeeId:
                                                    e
                                                        .target
                                                        .value,
                                                basicSalary:
                                                    selectedEmployee?.basicSalary ??
                                                    ""
                                            });
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Month
                                        </label>

                                        <select
                                            value={
                                                payrollForm.month
                                            }
                                            onChange={(e) =>
                                                setPayrollForm(
                                                    {
                                                        ...payrollForm,
                                                        month: e
                                                            .target
                                                            .value
                                                    }
                                                )
                                            }
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                        >
                                            {months.map(
                                                (
                                                    month
                                                ) => (
                                                    <option
                                                        key={
                                                            month.value
                                                        }
                                                        value={
                                                            month.value
                                                        }
                                                    >
                                                        {
                                                            month.label
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Year
                                        </label>

                                        <input
                                            type="number"
                                            value={
                                                payrollForm.year
                                            }
                                            onChange={(e) =>
                                                setPayrollForm(
                                                    {
                                                        ...payrollForm,
                                                        year: e
                                                            .target
                                                            .value
                                                    }
                                                )
                                            }
                                            min="2000"
                                            max="2100"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Basic Salary
                                    </label>

                                    <input
                                        type="number"
                                        value={
                                            payrollForm.basicSalary
                                        }
                                        readOnly
                                        placeholder="Select an employee"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-700 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Allowances
                                    </label>

                                    <input
                                        type="number"
                                        value={
                                            payrollForm.allowances
                                        }
                                        onChange={(e) =>
                                            setPayrollForm(
                                                {
                                                    ...payrollForm,
                                                    allowances:
                                                        e
                                                            .target
                                                            .value
                                                }
                                            )
                                        }
                                        placeholder="Enter allowances"
                                        min="0"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Deductions
                                    </label>

                                    <input
                                        type="number"
                                        value={
                                            payrollForm.deductions
                                        }
                                        onChange={(e) =>
                                            setPayrollForm(
                                                {
                                                    ...payrollForm,
                                                    deductions:
                                                        e
                                                            .target
                                                            .value
                                                }
                                            )
                                        }
                                        placeholder="Enter deductions"
                                        min="0"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowAddPayrollModal(
                                            false
                                        )
                                    }
                                    disabled={
                                        isCreatingPayroll
                                    }
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        isCreatingPayroll
                                    }
                                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-medium transition"
                                >
                                    {isCreatingPayroll
                                        ? "Creating..."
                                        : "Create Payroll"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================
                MARK AS PAID MODAL
            ========================== */}

            {showPaidModal &&
                payrollToMarkPaid && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
                        <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Mark Payroll as Paid
                                    </h2>

                                    <p className="text-sm text-gray-500 mt-1">
                                        Confirm payroll payment
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPaidModal(
                                            false
                                        );

                                        setPayrollToMarkPaid(
                                            null
                                        );
                                    }}
                                    disabled={
                                        isMarkingPaid
                                    }
                                    className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
                                    title="Close"
                                    aria-label="Close payment confirmation"
                                >
                                    <FontAwesomeIcon
                                        icon={faXmark}
                                    />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-gray-500">
                                            Employee
                                        </span>

                                        <span className="text-sm font-medium text-gray-900 text-right">
                                            {getEmployeeName(
                                                payrollToMarkPaid
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-gray-500">
                                            Employee ID
                                        </span>

                                        <span className="text-sm font-medium text-gray-900">
                                            {getEmployeeCode(
                                                payrollToMarkPaid
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-gray-500">
                                            Payroll Month
                                        </span>

                                        <span className="text-sm font-medium text-gray-900">
                                            {formatMonth(
                                                payrollToMarkPaid.month,
                                                payrollToMarkPaid.year
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-200">
                                        <span className="text-sm font-medium text-gray-700">
                                            Net Salary
                                        </span>

                                        <span className="text-base font-bold text-gray-900">
                                            {formatCurrency(
                                                payrollToMarkPaid.netSalary
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 mt-4">
                                    Are you sure this payroll has been paid? Once confirmed, the payment status will change from Pending to Paid.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPaidModal(
                                            false
                                        );

                                        setPayrollToMarkPaid(
                                            null
                                        );
                                    }}
                                    disabled={
                                        isMarkingPaid
                                    }
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        confirmMarkAsPaid
                                    }
                                    disabled={
                                        isMarkingPaid
                                    }
                                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition inline-flex items-center gap-2"
                                >
                                    {!isMarkingPaid && (
                                        <FontAwesomeIcon
                                            icon={faCheck}
                                            className="text-xs"
                                        />
                                    )}

                                    {isMarkingPaid
                                        ? "Processing..."
                                        : "Confirm Payment"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {/* =========================
                DELETE PAYROLL MODAL
            ========================== */}

            {showDeleteModal &&
                payrollToDelete && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
                        <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Delete Payroll
                                    </h2>

                                    <p className="text-sm text-gray-500 mt-1">
                                        Confirm payroll deletion
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteModal(
                                            false
                                        );

                                        setPayrollToDelete(
                                            null
                                        );
                                    }}
                                    disabled={
                                        isDeletingPayroll
                                    }
                                    className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
                                    title="Close"
                                    aria-label="Close delete confirmation"
                                >
                                    <FontAwesomeIcon
                                        icon={faXmark}
                                    />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <FontAwesomeIcon
                                            icon={
                                                faCircleExclamation
                                            }
                                            className="text-red-500 mt-0.5"
                                        />

                                        <p className="text-sm text-red-700">
                                            Are you sure you want to delete this payroll record?
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-gray-500">
                                            Employee
                                        </span>

                                        <span className="text-sm font-medium text-gray-900 text-right">
                                            {getEmployeeName(
                                                payrollToDelete
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-gray-500">
                                            Payroll Month
                                        </span>

                                        <span className="text-sm font-medium text-gray-900">
                                            {formatMonth(
                                                payrollToDelete.month,
                                                payrollToDelete.year
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-gray-500">
                                            Net Salary
                                        </span>

                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(
                                                payrollToDelete.netSalary
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-400 mt-4">
                                    This payroll record will be removed from the active payroll list.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteModal(
                                            false
                                        );

                                        setPayrollToDelete(
                                            null
                                        );
                                    }}
                                    disabled={
                                        isDeletingPayroll
                                    }
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        confirmDeletePayroll
                                    }
                                    disabled={
                                        isDeletingPayroll
                                    }
                                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition inline-flex items-center gap-2"
                                >
                                    {!isDeletingPayroll && (
                                        <FontAwesomeIcon
                                            icon={faTrash}
                                            className="text-xs"
                                        />
                                    )}

                                    {isDeletingPayroll
                                        ? "Deleting..."
                                        : "Delete Payroll"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}

// =========================
// SUMMARY CARD
// =========================

function SummaryCard({
    title,
    value,
    description,
    icon,
    iconClass
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500">
                        {title}
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-2">
                        {value}
                    </h2>

                    <p className="text-xs text-gray-400 mt-1">
                        {description}
                    </p>
                </div>

                <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center ${iconClass}`}
                >
                    <FontAwesomeIcon
                        icon={icon}
                        className="text-base"
                    />
                </div>
            </div>
        </div>
    );
}

// =========================
// PAYMENT STATUS BADGE
// =========================

function PaymentStatusBadge({ status }) {
    const styles = {
        Pending:
            "bg-orange-50 text-orange-700",
        Paid:
            "bg-green-50 text-green-700"
    };

    return (
        <span
            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                styles[status] ||
                "bg-gray-50 text-gray-600"
            }`}
        >
            {status || "-"}
        </span>
    );
}

// =========================
// INFO ROW
// =========================

function InfoRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-500">
                {label}
            </span>

            <span className="text-sm font-medium text-gray-800 text-right">
                {value}
            </span>
        </div>
    );
}

// =========================
// MONEY ROW
// =========================

function MoneyRow({ label, value }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
                {label}
            </span>

            <span className="text-sm font-medium text-gray-800">
                {formatMoney(value)}
            </span>
        </div>
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(value || 0);
}

export default PayrollManagement;