import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const EmployeePayroll = () => {
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchMyPayroll();
    }, []);

    const fetchMyPayroll = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/payroll/my-payroll");
            setPayrolls(response.data.payrolls || []);
        } catch (err) {
            console.error("Error fetching employee payroll:", err);
            setError(
                err.response?.data?.message ||
                    "Unable to load your payroll records."
            );
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(amount || 0);

    const formatMonth = (month, year) =>
        new Date(year, month - 1).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
        });

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const paidCount = payrolls.filter(
        (payroll) => payroll.paymentStatus === "Paid"
    ).length;

    const pendingCount = payrolls.filter(
        (payroll) => payroll.paymentStatus === "Pending"
    ).length;

    if (loading) {
        return (
            <div className="p-6 text-gray-500">
                Loading your payroll records...
            </div>
        );
    }

    return (
        <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
            {/* Page Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="mb-1 text-sm font-semibold text-violet-600">
                        Employee Portal
                    </p>

                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                        My Payroll
                    </h1>

                    <p className="mt-2 text-sm text-gray-500 sm:text-base">
                        View your salary records and payment details.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchMyPayroll}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
                >
                    ↻ Refresh
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div
                    role="alert"
                    className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <p className="text-sm text-red-700">{error}</p>

                    <button
                        type="button"
                        onClick={fetchMyPayroll}
                        className="self-start text-sm font-semibold text-red-700 underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Summary Cards */}
            {!error && (
                <>
                    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">
                                Total Payroll Records
                            </p>

                            <div className="mt-3 flex items-end justify-between">
                                <h2 className="text-3xl font-bold text-gray-900">
                                    {payrolls.length}
                                </h2>

                                <span className="rounded-xl bg-blue-50 px-3 py-2 text-xl text-blue-600">
                                    ▤
                                </span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">
                                Paid Records
                            </p>

                            <div className="mt-3 flex items-end justify-between">
                                <h2 className="text-3xl font-bold text-gray-900">
                                    {paidCount}
                                </h2>

                                <span className="rounded-xl bg-green-50 px-3 py-2 text-xl text-green-600">
                                    ✓
                                </span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">
                                Pending Records
                            </p>

                            <div className="mt-3 flex items-end justify-between">
                                <h2 className="text-3xl font-bold text-gray-900">
                                    {pendingCount}
                                </h2>

                                <span className="rounded-xl bg-amber-50 px-3 py-2 text-xl text-amber-600">
                                    ◷
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payroll Table */}
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                            <h2 className="text-lg font-bold text-gray-900">
                                Salary History
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Your monthly salary breakdown and payment status.
                            </p>
                        </div>

                        {payrolls.length === 0 ? (
                            <div className="px-6 py-16 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                                    ₹
                                </div>

                                <h3 className="text-base font-semibold text-gray-900">
                                    No payroll records found
                                </h3>

                                <p className="mt-2 text-sm text-gray-500">
                                    Your salary records will appear here when available.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px] text-left text-sm">
                                    <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">
                                                Payroll Period
                                            </th>
                                            <th className="px-6 py-4 font-semibold">
                                                Basic Salary
                                            </th>
                                            <th className="px-6 py-4 font-semibold">
                                                Allowances
                                            </th>
                                            <th className="px-6 py-4 font-semibold">
                                                Deductions
                                            </th>
                                            <th className="px-6 py-4 font-semibold">
                                                Net Salary
                                            </th>
                                            <th className="px-6 py-4 font-semibold">
                                                Payment Status
                                            </th>
                                            <th className="px-6 py-4 font-semibold">
                                                Paid Date
                                            </th>
                                            <th className="px-6 py-4 font-semibold">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {payrolls.map((payroll) => (
                                            <tr
                                                key={payroll._id}
                                                className="transition hover:bg-gray-50"
                                            >
                                                <td className="whitespace-nowrap px-6 py-5 font-semibold text-gray-900">
                                                    {formatMonth(
                                                        payroll.month,
                                                        payroll.year
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-5 text-gray-600">
                                                    {formatCurrency(
                                                        payroll.basicSalary
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-5 text-gray-600">
                                                    {formatCurrency(
                                                        payroll.allowances
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-5 text-gray-600">
                                                    {formatCurrency(
                                                        payroll.deductions
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-5 font-bold text-gray-900">
                                                    {formatCurrency(
                                                        payroll.netSalary
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-5">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                            payroll.paymentStatus ===
                                                            "Paid"
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-amber-100 text-amber-700"
                                                        }`}
                                                    >
                                                        {payroll.paymentStatus}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-5 text-gray-600">
                                                    {formatDate(
                                                        payroll.paidDate
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-5">
                                                    <button
                                                        type="button"
                                                        disabled
                                                        title="PDF download will be implemented next"
                                                        className="cursor-not-allowed rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-400"
                                                    >
                                                        Download Payslip
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <p className="mt-4 text-xs text-gray-400">
                        For salary discrepancies, please contact your HR administrator.
                    </p>
                </>
            )}
        </div>
    );
};

export default EmployeePayroll;