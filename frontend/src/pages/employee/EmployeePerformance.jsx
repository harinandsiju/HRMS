import { useEffect, useState } from "react";
import api from "../../api/axios";

function EmployeePerformance() {
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(null);
    const [count, setCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedReview, setSelectedReview] = useState(null);

    // =========================
    // FETCH PERFORMANCE
    // =========================

    const fetchPerformance = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/performance/my-performance"
            );

            setReviews(
                response.data.reviews || []
            );

            setAverageRating(
                response.data.averageRating ?? null
            );

            setCount(
                response.data.count || 0
            );
        } catch (err) {
            console.error(
                "Fetch employee performance error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load performance reviews."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPerformance();
    }, []);

    // =========================
    // HELPERS
    // =========================

    const formatDate = (date) => {
        if (!date) {
            return "Not available";
        }

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

    const getRatingClass = (rating) => {
        if (rating >= 4) {
            return "bg-green-50 text-green-700 border-green-100";
        }

        if (rating >= 3) {
            return "bg-orange-50 text-orange-700 border-orange-100";
        }

        return "bg-red-50 text-red-700 border-red-100";
    };

    const renderStars = (rating) => {
        const numericRating = Number(rating) || 0;

        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <i
                        key={star}
                        className={
                            star <= numericRating
                                ? "fas fa-star text-yellow-400"
                                : "far fa-star text-gray-300"
                        }
                    />
                ))}
            </div>
        );
    };

    // =========================
    // LOADING
    // =========================

    if (loading) {
        return (
            <div className="space-y-6">

                <div>
                    <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-80 bg-gray-100 rounded mt-2 animate-pulse" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
                        <div className="h-4 w-28 bg-gray-200 rounded" />
                        <div className="h-9 w-20 bg-gray-200 rounded mt-4" />
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
                        <div className="h-4 w-28 bg-gray-200 rounded" />
                        <div className="h-9 w-20 bg-gray-200 rounded mt-4" />
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse">
                    <div className="h-5 w-40 bg-gray-200 rounded" />
                    <div className="h-16 w-full bg-gray-100 rounded mt-5" />
                    <div className="h-16 w-full bg-gray-100 rounded mt-3" />
                </div>

            </div>
        );
    }

    // =========================
    // PAGE
    // =========================

    return (
        <div className="space-y-6">

            {/* PAGE HEADER */}

            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    Performance
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                    View your performance reviews and feedback.
                </p>
            </div>


            {/* ERROR */}

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 flex items-center justify-between gap-4">

                    <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                            <i className="fas fa-exclamation-triangle" />
                        </div>

                        <p className="text-sm text-red-700">
                            {error}
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={fetchPerformance}
                        className="text-sm font-medium text-red-700 hover:text-red-800"
                    >
                        Retry
                    </button>

                </div>
            )}


            {/* SUMMARY CARDS */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* AVERAGE RATING */}

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">

                    <div className="flex items-start justify-between">

                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Average Rating
                            </p>

                            <p className="text-3xl font-semibold text-gray-900 mt-2">
                                {averageRating !== null
                                    ? averageRating
                                    : "—"}
                                <span className="text-base font-normal text-gray-400 ml-1">
                                    / 5
                                </span>
                            </p>

                            {averageRating !== null && (
                                <div className="mt-2">
                                    {renderStars(
                                        Number(
                                            averageRating
                                        )
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                            <i className="fas fa-star" />
                        </div>

                    </div>

                </div>


                {/* TOTAL REVIEWS */}

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">

                    <div className="flex items-start justify-between">

                        <div>

                            <p className="text-sm font-medium text-gray-500">
                                Performance Reviews
                            </p>

                            <p className="text-3xl font-semibold text-gray-900 mt-2">
                                {count}
                            </p>

                            <p className="text-sm text-gray-400 mt-1">
                                Review{count === 1 ? "" : "s"} available
                            </p>

                        </div>

                        <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <i className="fas fa-chart-line" />
                        </div>

                    </div>

                </div>

            </div>


            {/* PERFORMANCE HISTORY */}

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                <div className="px-5 py-4 border-b border-gray-100">

                    <h2 className="text-lg font-semibold text-gray-900">
                        Performance History
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                        Your performance reviews submitted by the administrator.
                    </p>

                </div>


                {reviews.length === 0 ? (

                    <div className="px-6 py-16 text-center">

                        <div className="w-16 h-16 mx-auto rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                            <i className="fas fa-chart-line text-2xl" />
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900">
                            No performance reviews
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                            No performance reviews are available yet.
                        </p>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[800px]">

                            <thead className="bg-gray-50 border-b border-gray-100">

                                <tr>

                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Review Period
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Rating
                                    </th>

                                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Review Date
                                    </th>

                                    <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody className="divide-y divide-gray-100">

                                {reviews.map((review) => (

                                    <tr
                                        key={review._id}
                                        className="hover:bg-gray-50 transition"
                                    >

                                        <td className="px-5 py-4">

                                            <p className="text-sm font-medium text-gray-900">
                                                {review.reviewPeriod || "Not specified"}
                                            </p>

                                        </td>


                                        <td className="px-5 py-4">

                                            <div className="flex items-center gap-3">

                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${getRatingClass(
                                                        review.rating
                                                    )}`}
                                                >
                                                    {review.rating}/5
                                                </span>

                                                {renderStars(
                                                    review.rating
                                                )}

                                            </div>

                                        </td>


                                        <td className="px-5 py-4 text-sm text-gray-600">

                                            {formatDate(
                                                review.createdAt
                                            )}

                                        </td>


                                        <td className="px-5 py-4 text-right">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedReview(
                                                        review
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                                            >
                                                <i className="fas fa-eye text-xs" />
                                                View Review
                                            </button>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* REVIEW DETAILS MODAL */}

            {selectedReview && (

                <div
                    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                    onClick={() =>
                        setSelectedReview(null)
                    }
                >

                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}

                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">

                            <div>

                                <h2 className="text-lg font-semibold text-gray-900">
                                    Performance Review
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedReview.reviewPeriod ||
                                        "Review Period"}
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedReview(null)
                                }
                                className="w-9 h-9 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                            >
                                <i className="fas fa-times" />
                            </button>

                        </div>


                        {/* MODAL BODY */}

                        <div className="p-6 space-y-6">

                            {/* RATING */}

                            <div className="bg-violet-50 border border-violet-100 rounded-xl p-5">

                                <div className="flex items-center justify-between gap-4">

                                    <div>

                                        <p className="text-sm font-medium text-violet-700">
                                            Overall Rating
                                        </p>

                                        <p className="text-3xl font-semibold text-gray-900 mt-1">
                                            {selectedReview.rating}
                                            <span className="text-base font-normal text-gray-400">
                                                /5
                                            </span>
                                        </p>

                                    </div>

                                    <div className="text-lg">
                                        {renderStars(
                                            selectedReview.rating
                                        )}
                                    </div>

                                </div>

                            </div>


                            {/* STRENGTHS */}

                            <div>

                                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                    Strengths
                                </h3>

                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">

                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-6">
                                        {selectedReview.strengths ||
                                            "No strengths provided."}
                                    </p>

                                </div>

                            </div>


                            {/* AREAS OF IMPROVEMENT */}

                            <div>

                                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                    Areas of Improvement
                                </h3>

                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">

                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-6">
                                        {selectedReview.areasOfImprovement ||
                                            "No areas of improvement provided."}
                                    </p>

                                </div>

                            </div>


                            {/* FEEDBACK */}

                            <div>

                                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                    Feedback
                                </h3>

                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">

                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-6">
                                        {selectedReview.feedback ||
                                            "No feedback provided."}
                                    </p>

                                </div>

                            </div>


                            {/* GOALS */}

                            <div>

                                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                    Goals
                                </h3>

                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">

                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-6">
                                        {selectedReview.goals ||
                                            "No goals provided."}
                                    </p>

                                </div>

                            </div>


                            {/* REVIEW DATE */}

                            <div className="pt-2 border-t border-gray-100">

                                <p className="text-xs text-gray-500">
                                    Review recorded on{" "}
                                    <span className="font-medium text-gray-700">
                                        {formatDate(
                                            selectedReview.createdAt
                                        )}
                                    </span>
                                </p>

                            </div>

                        </div>


                        {/* MODAL FOOTER */}

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedReview(null)
                                }
                                className="px-4 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition"
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default EmployeePerformance;