import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import jsPDF from "jspdf";

const EmployeePayroll = () => {
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloadingId, setDownloadingId] = useState(null);

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

    // Generate and download a PDF payslip for the selected payroll record.
    const downloadPayslip = async (payroll) => {
        try {
            setDownloadingId(payroll._id);

            const employee = payroll.employeeId || {};

            const department =
                typeof employee.departmentId === "object"
                    ? employee.departmentId?.name
                    : "";

            const employeeName =
                `${employee.firstName || ""} ${
                    employee.lastName || ""
                }`.trim() || "Employee";

            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 16;
            const contentWidth = pageWidth - margin * 2;

            const formatPDFCurrency = (amount) =>
                `INR ${Number(amount || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`;

            const formatPDFDate = (date) => {
                if (!date) return "Not paid";

                return new Date(date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                });
            };

            const drawSectionHeading = (title, y) => {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(12);
                doc.setTextColor(30, 41, 59);
                doc.text(title, margin, y);

                doc.setDrawColor(226, 232, 240);
                doc.line(margin, y + 3, pageWidth - margin, y + 3);
            };

            // Header
            doc.setFillColor(30, 41, 59);
            doc.rect(0, 0, pageWidth, 43, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(23);
            doc.text("TechNova", margin, 19);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text("SOLUTIONS PVT. LTD.", margin, 26);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(15);
            doc.text("SALARY PAYSLIP", pageWidth - margin, 18, {
                align: "right",
            });

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(
                formatMonth(payroll.month, payroll.year),
                pageWidth - margin,
                26,
                { align: "right" }
            );

            // Employee information
            let y = 56;

            drawSectionHeading("Employee Information", y);

            y += 14;

            const employeeDetails = [
                ["Employee Name", employeeName],
                ["Employee Code", employee.employeeCode || "N/A"],
                ["Email Address", employee.email || "N/A"],
                ["Designation", employee.designation || "N/A"],
                ["Department", department || "N/A"],
            ];

            doc.setFontSize(10);

            employeeDetails.forEach(([label, value]) => {
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 116, 139);
                doc.text(label, margin, y);

                doc.setFont("helvetica", "bold");
                doc.setTextColor(30, 41, 59);

                const valueLines = doc.splitTextToSize(
                    String(value),
                    contentWidth - 58
                );

                doc.text(valueLines, margin + 58, y);

                y += Math.max(8, valueLines.length * 5);
            });

            // Salary breakdown
            y += 8;

            drawSectionHeading("Salary Breakdown", y);

            y += 12;

            doc.setFillColor(241, 245, 249);
            doc.rect(
                margin,
                y - 5,
                contentWidth,
                11,
                "F"
            );

            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(51, 65, 85);

            doc.text("DESCRIPTION", margin + 4, y + 2);
            doc.text("AMOUNT (INR)", pageWidth - margin - 4, y + 2, {
                align: "right",
            });

            y += 13;

            const salaryRows = [
                ["Basic Salary", Number(payroll.basicSalary || 0)],
                ["Allowances", Number(payroll.allowances || 0)],
                ["Deductions", -Number(payroll.deductions || 0)],
            ];

            salaryRows.forEach(([label, amount]) => {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.setTextColor(51, 65, 85);

                doc.text(label, margin + 4, y);

                const formattedAmount =
                    amount < 0
                        ? `- ${formatPDFCurrency(Math.abs(amount))}`
                        : formatPDFCurrency(amount);

                doc.text(
                    formattedAmount,
                    pageWidth - margin - 4,
                    y,
                    { align: "right" }
                );

                doc.setDrawColor(226, 232, 240);
                doc.line(
                    margin,
                    y + 4,
                    pageWidth - margin,
                    y + 4
                );

                y += 11;
            });

            // Net salary
            y += 4;

            doc.setFillColor(220, 252, 231);
            doc.roundedRect(
                margin,
                y - 5,
                contentWidth,
                16,
                2,
                2,
                "F"
            );

            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(22, 101, 52);

            doc.text("NET SALARY", margin + 4, y + 5);

            doc.text(
                formatPDFCurrency(payroll.netSalary),
                pageWidth - margin - 4,
                y + 5,
                { align: "right" }
            );

            // Payment information
            y += 29;

            drawSectionHeading("Payment Information", y);

            y += 13;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(71, 85, 105);

            doc.text("Payment Status", margin, y);

            const isPaid = payroll.paymentStatus === "Paid";

            doc.setFont("helvetica", "bold");
            doc.setTextColor(
                isPaid ? 22 : 180,
                isPaid ? 101 : 83,
                isPaid ? 52 : 9
            );

            doc.text(
                payroll.paymentStatus || "N/A",
                margin + 42,
                y
            );

            y += 9;

            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
            doc.text("Paid Date", margin, y);

            doc.setTextColor(30, 41, 59);
            doc.text(
                formatPDFDate(payroll.paidDate),
                margin + 42,
                y
            );

            // Footer
            const pageHeight = doc.internal.pageSize.getHeight();

            doc.setDrawColor(226, 232, 240);
            doc.line(
                margin,
                pageHeight - 22,
                pageWidth - margin,
                pageHeight - 22
            );

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);

            doc.text(
                "This payslip was generated electronically by TechNova HRMS.",
                pageWidth / 2,
                pageHeight - 15,
                { align: "center" }
            );

            doc.text(
                "Please contact your HR administrator for salary-related queries.",
                pageWidth / 2,
                pageHeight - 10,
                { align: "center" }
            );

            const filename =
                `Payslip_${payroll.year}_${String(
                    payroll.month
                ).padStart(2, "0")}.pdf`;

            doc.save(filename);
        } catch (err) {
            console.error("Payslip PDF generation failed:", err);
            window.alert(
                "Unable to generate the payslip. Please try again."
            );
        } finally {
            setDownloadingId(null);
        }
    };

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
                                                        onClick={() =>
                                                            downloadPayslip(
                                                                payroll
                                                            )
                                                        }
                                                        disabled={
                                                            downloadingId ===
                                                            payroll._id
                                                        }
                                                        className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
                                                    >
                                                        {downloadingId ===
                                                        payroll._id
                                                            ? "Generating..."
                                                            : "Download Payslip"}
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