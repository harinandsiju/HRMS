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
                "Unable to load your payroll records. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(amount || 0);
    };

    const formatMonth = (month, year) => {
        const date = new Date(year, month - 1);

        return date.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
        });
    };

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="employee-payroll-page">
                <p>Loading your payroll records...</p>
            </div>
        );
    }

    return (
        <div className="employee-payroll-page">
            <div className="payroll-page-header">
                <div>
                    <h1>My Payroll</h1>
                    <p>View your salary records and payment details.</p>
                </div>

                <button
                    type="button"
                    onClick={fetchMyPayroll}
                    className="payroll-refresh-btn"
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div className="payroll-error" role="alert">
                    <p>{error}</p>

                    <button type="button" onClick={fetchMyPayroll}>
                        Try Again
                    </button>
                </div>
            )}

            {!error && payrolls.length === 0 && (
                <div className="payroll-empty-state">
                    <h3>No payroll records found</h3>
                    <p>Your salary records will appear here when available.</p>
                </div>
            )}

            {payrolls.length > 0 && (
                <>
                    <div className="payroll-summary">
                        <div className="payroll-summary-card">
                            <span>Total Records</span>
                            <h2>{payrolls.length}</h2>
                        </div>

                        <div className="payroll-summary-card">
                            <span>Paid Records</span>
                            <h2>
                                {
                                    payrolls.filter(
                                        (payroll) =>
                                            payroll.paymentStatus === "Paid"
                                    ).length
                                }
                            </h2>
                        </div>

                        <div className="payroll-summary-card">
                            <span>Pending Records</span>
                            <h2>
                                {
                                    payrolls.filter(
                                        (payroll) =>
                                            payroll.paymentStatus === "Pending"
                                    ).length
                                }
                            </h2>
                        </div>
                    </div>

                    <div className="payroll-table-container">
                        <table className="employee-payroll-table">
                            <thead>
                                <tr>
                                    <th>Payroll Period</th>
                                    <th>Basic Salary</th>
                                    <th>Allowances</th>
                                    <th>Deductions</th>
                                    <th>Net Salary</th>
                                    <th>Payment Status</th>
                                    <th>Paid Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {payrolls.map((payroll) => (
                                    <tr key={payroll._id}>
                                        <td>
                                            {formatMonth(
                                                payroll.month,
                                                payroll.year
                                            )}
                                        </td>

                                        <td>
                                            {formatCurrency(
                                                payroll.basicSalary
                                            )}
                                        </td>

                                        <td>
                                            {formatCurrency(
                                                payroll.allowances
                                            )}
                                        </td>

                                        <td>
                                            {formatCurrency(
                                                payroll.deductions
                                            )}
                                        </td>

                                        <td className="payroll-net-salary">
                                            {formatCurrency(
                                                payroll.netSalary
                                            )}
                                        </td>

                                        <td>
                                            <span
                                                className={`payroll-status ${
                                                    payroll.paymentStatus?.toLowerCase() ||
                                                    "unknown"
                                                }`}
                                            >
                                                {payroll.paymentStatus}
                                            </span>
                                        </td>

                                        <td>
                                            {formatDate(payroll.paidDate)}
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="payslip-download-btn"
                                                disabled
                                                title="PDF download will be added in the next step"
                                            >
                                                Download Payslip
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default EmployeePayroll;