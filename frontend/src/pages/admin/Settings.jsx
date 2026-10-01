import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const DEFAULT_SETTINGS = {
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    companyLogo: "",
    notificationSettings: {
        emailNotifications: true,
        inAppNotifications: true,
        leaveNotifications: true,
        taskNotifications: true,
        payrollNotifications: true
    },
    userPreferences: {
        language: "English",
        timeZone: "Asia/Kolkata",
        dateFormat: "DD MMM YYYY"
    },
    security: {
        sessionTimeout: 30,
        minimumPasswordLength: 8,
        requireStrongPassword: true
    }
};

const Settings = () => {
    const [settings, setSettings] = useState(null);
    const [formData, setFormData] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);

    // Temporary local logo preview.
    // This is NOT sent to the backend.
    const [logoPreview, setLogoPreview] = useState("");

    const [toast, setToast] = useState({
        show: false,
        type: "",
        message: ""
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (!toast.show) {
            return;
        }

        const timer = setTimeout(() => {
            setToast({
                show: false,
                type: "",
                message: ""
            });
        }, 3000);

        return () => clearTimeout(timer);
    }, [toast.show]);

    const showToast = (type, message) => {
        setToast({
            show: true,
            type,
            message
        });
    };

    const createSafeSettings = (data) => {
        return {
            ...DEFAULT_SETTINGS,
            ...data,

            notificationSettings: {
                ...DEFAULT_SETTINGS.notificationSettings,
                ...(data?.notificationSettings || {})
            },

            userPreferences: {
                ...DEFAULT_SETTINGS.userPreferences,
                ...(data?.userPreferences || {})
            },

            security: {
                ...DEFAULT_SETTINGS.security,
                ...(data?.security || {})
            }
        };
    };

    const cloneSettings = (data) => {
        return JSON.parse(JSON.stringify(data));
    };

    const fetchSettings = async () => {
        try {
            setLoading(true);

            const response = await api.get("/settings");

            const fetchedSettings = createSafeSettings(
                response.data?.settings
            );

            setSettings(fetchedSettings);
            setFormData(cloneSettings(fetchedSettings));

            setLogoPreview("");
        } catch (error) {
            console.error("Fetch Settings Error:", error);

            showToast(
                "error",
                error.response?.data?.message ||
                    "Failed to load settings"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCompanyChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNotificationChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            notificationSettings: {
                ...prev.notificationSettings,
                [field]: value
            }
        }));
    };

    const handlePreferenceChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            userPreferences: {
                ...prev.userPreferences,
                [field]: value
            }
        }));
    };

    const handleSecurityChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            security: {
                ...prev.security,
                [field]: value
            }
        }));
    };

const handleSave = async () => {
    if (!formData) {
        return;
    }

    try {
        setSaving(true);

        /*
         * Do not send logoPreview here.
         * The actual logo upload is handled separately
         * through the upload endpoint.
         */
        const dataToSave = {
            companyName: formData.companyName,
            companyEmail: formData.companyEmail,
            companyPhone: formData.companyPhone,
            companyAddress: formData.companyAddress,
            companyLogo: formData.companyLogo,
            notificationSettings: {
                ...formData.notificationSettings
            },
            userPreferences: {
                ...formData.userPreferences
            },
            security: {
                ...formData.security
            }
        };

        const response = await api.put(
            "/settings",
            dataToSave
        );

        const updatedSettings = createSafeSettings(
            response.data?.settings
        );

        setSettings(updatedSettings);
        setFormData(cloneSettings(updatedSettings));

        /*
         * Clear temporary logo preview after successful save.
         */
        if (logoPreview) {
            URL.revokeObjectURL(logoPreview);
            setLogoPreview("");
        }

        showToast(
            "success",
            "Settings saved successfully"
        );

        /*
         * Reload the page after the settings are saved.
         * This makes the Sidebar fetch and display
         * the latest company logo immediately.
         */
        setTimeout(() => {
            window.location.reload();
        }, 500);

    } catch (error) {
        console.error("Save Settings Error:", error);

        showToast(
            "error",
            error.response?.data?.message ||
                "Failed to save settings"
        );
    } finally {
        setSaving(false);
    }
};

    const handleReset = () => {
        if (!settings) {
            return;
        }

        setResetting(true);

        if (logoPreview) {
            URL.revokeObjectURL(logoPreview);
        }

        setLogoPreview("");
        setFormData(cloneSettings(settings));

        setTimeout(() => {
            setResetting(false);

            showToast(
                "success",
                "Changes have been reset"
            );
        }, 300);
    };

const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        showToast(
            "error",
            "Please select a JPG, PNG or WEBP image"
        );

        event.target.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast(
            "error",
            "Logo size must be less than 5 MB"
        );

        event.target.value = "";
        return;
    }

    try {
        setSaving(true);

        const uploadData = new FormData();

        uploadData.append(
            "companyLogo",
            file
        );

        const response = await api.post(
            "/settings/logo",
            uploadData
        );

        const updatedSettings =
            response.data.settings;

        setSettings(updatedSettings);

        setFormData(
            JSON.parse(
                JSON.stringify(
                    updatedSettings
                )
            )
        );

        showToast(
            "success",
            "Company logo uploaded successfully"
        );
    } catch (error) {
        console.error(
            "Upload Company Logo Error:",
            error
        );

        showToast(
            "error",
            error.response?.data?.message ||
                "Failed to upload company logo"
        );
    } finally {
        setSaving(false);
        event.target.value = "";
    }
};

    const getLogoSource = () => {
        if (logoPreview) {
            return logoPreview;
        }

        if (formData?.companyLogo) {
            return formData.companyLogo;
        }

        return "";
    };

    if (loading) {
        return (
            <div className="min-h-full bg-gray-50 p-4 sm:p-6">
                <div className="animate-pulse space-y-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <div className="h-9 w-52 bg-gray-200 rounded-lg" />
                            <div className="h-4 w-80 bg-gray-200 rounded mt-3" />
                        </div>

                        <div className="h-12 w-36 bg-gray-200 rounded-xl" />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                        <div className="h-80 bg-white rounded-2xl border border-gray-100" />

                        <div className="h-80 bg-white rounded-2xl border border-gray-100" />

                        <div className="h-64 bg-white rounded-2xl border border-gray-100" />

                        <div className="h-64 bg-white rounded-2xl border border-gray-100" />

                    </div>
                </div>
            </div>
        );
    }

    if (!formData) {
        return (
            <div className="min-h-full bg-gray-50 flex items-center justify-center p-6">

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md w-full">

                    <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center">
                        <i className="fas fa-exclamation-circle text-red-500 text-2xl" />
                    </div>

                    <h2 className="text-lg font-semibold text-gray-900 mt-4">
                        Unable to load settings
                    </h2>

                    <p className="text-sm text-gray-500 mt-2">
                        Something went wrong while loading the settings.
                    </p>

                    <button
                        type="button"
                        onClick={fetchSettings}
                        className="mt-5 px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
                    >
                        Try Again
                    </button>

                </div>

            </div>
        );
    }

    const logoSource = getLogoSource();

    return (
      <div className="min-h-full bg-gray-50 p-4 sm:p-6">
        {/* Toast */}
        {toast.show && (
          <div className="fixed top-5 right-5 z-[100] min-w-[300px] max-w-[420px] bg-white border border-gray-100 rounded-xl shadow-xl px-4 py-3 flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                toast.type === "success"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              <i
                className={`fas ${
                  toast.type === "success" ? "fa-check" : "fa-exclamation"
                }`}
              />
            </div>

            <p className="text-sm font-medium text-gray-700 flex-1">
              {toast.message}
            </p>

            <button
              type="button"
              onClick={() =>
                setToast({
                  show: false,
                  type: "",
                  message: "",
                })
              }
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <i className="fas fa-times" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Settings
            </h1>

            <p className="mt-1.5 text-sm sm:text-base text-gray-500">
              Configure company preferences and application settings.
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Company Information */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <SectionIcon icon="fa-building" />

              <h2 className="text-lg font-semibold text-gray-900">
                Company Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-6">
              {/* Logo */}
              <div className="flex flex-col items-center">
                <div className="w-[136px] h-[150px] border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50">
                  {logoSource ? (
<img
    src={
        logoSource
            ? /^https?:\/\//i.test(logoSource)
                ? logoSource
                : `${api.defaults.baseURL}/${logoSource.replace(
                      /^\/+/,
                      ""
                  )}`
            : ""
    }
    alt="Company Logo"
    className="w-full h-full object-contain p-4"
/>
                  ) : (
                    <i className="fas fa-building text-violet-500 text-5xl" />
                  )}
                </div>

                <label className="mt-3 cursor-pointer border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 transition">
                  <i className="fas fa-camera mr-2" />
                  Change Logo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Company Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Company Name
                  </label>

                  <input
                    type="text"
                    value={formData.companyName || ""}
                    onChange={(e) =>
                      handleCompanyChange("companyName", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Company Email
                  </label>

                  <input
                    type="email"
                    value={formData.companyEmail || ""}
                    onChange={(e) =>
                      handleCompanyChange("companyEmail", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Company Phone
                    </label>

                    <input
                      type="text"
                      value={formData.companyPhone || ""}
                      onChange={(e) =>
                        handleCompanyChange("companyPhone", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Company Address
                    </label>

                    <input
                      type="text"
                      value={formData.companyAddress || ""}
                      onChange={(e) =>
                        handleCompanyChange("companyAddress", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Notification Settings */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <SectionIcon icon="fa-bell" />

              <h2 className="text-lg font-semibold text-gray-900">
                Notification Settings
              </h2>
            </div>

            <div className="space-y-5">
              <NotificationSetting
                title="Email Notifications"
                description="Receive email updates for important activities"
                checked={formData.notificationSettings.emailNotifications}
                onChange={(value) =>
                  handleNotificationChange("emailNotifications", value)
                }
              />

              <NotificationSetting
                title="In-App Notifications"
                description="Show notifications for updates in the application"
                checked={formData.notificationSettings.inAppNotifications}
                onChange={(value) =>
                  handleNotificationChange("inAppNotifications", value)
                }
              />

              <NotificationSetting
                title="Leave Notifications"
                description="Get notified for leave requests and approvals"
                checked={formData.notificationSettings.leaveNotifications}
                onChange={(value) =>
                  handleNotificationChange("leaveNotifications", value)
                }
              />

              <NotificationSetting
                title="Task Notifications"
                description="Receive updates about task assignments and deadlines"
                checked={formData.notificationSettings.taskNotifications}
                onChange={(value) =>
                  handleNotificationChange("taskNotifications", value)
                }
              />

              <NotificationSetting
                title="Payroll Notifications"
                description="Receive updates about payroll processing"
                checked={formData.notificationSettings.payrollNotifications}
                onChange={(value) =>
                  handleNotificationChange("payrollNotifications", value)
                }
              />
            </div>
          </section>

          {/* User Preferences */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <SectionIcon icon="fa-user" />

              <h2 className="text-lg font-semibold text-gray-900">
                User Preferences
              </h2>
            </div>

            <div className="space-y-4">
              <PreferenceRow icon="fa-globe" label="Language">
                <select
                  value={formData.userPreferences.language}
                  onChange={(e) =>
                    handlePreferenceChange("language", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition"
                >
                  <option value="English">English</option>
                </select>
              </PreferenceRow>

              <PreferenceRow icon="fa-clock" label="Time Zone">
                <select
                  value={formData.userPreferences.timeZone}
                  onChange={(e) =>
                    handlePreferenceChange("timeZone", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition"
                >
                  <option value="Asia/Kolkata">(GMT+05:30) Asia/Kolkata</option>

                  <option value="UTC">(GMT+00:00) UTC</option>

                  <option value="America/New_York">
                    (GMT-05:00) America/New_York
                  </option>

                  <option value="Europe/London">
                    (GMT+00:00) Europe/London
                  </option>

                  <option value="Asia/Dubai">(GMT+04:00) Asia/Dubai</option>
                </select>
              </PreferenceRow>

              <PreferenceRow icon="fa-calendar" label="Date Format">
                <select
                  value={formData.userPreferences.dateFormat}
                  onChange={(e) =>
                    handlePreferenceChange("dateFormat", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition"
                >
                  <option value="DD MMM YYYY">DD MMM YYYY (09 Jul 2026)</option>

                  <option value="DD/MM/YYYY">DD/MM/YYYY (09/07/2026)</option>

                  <option value="MM/DD/YYYY">MM/DD/YYYY (07/09/2026)</option>

                  <option value="YYYY-MM-DD">YYYY-MM-DD (2026-07-09)</option>
                </select>
              </PreferenceRow>
            </div>
          </section>

          {/* Security */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <SectionIcon icon="fa-shield-alt" />

              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            </div>

            <div className="space-y-5">
              {/* Session Timeout */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-800">
                    Session Timeout
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    Automatically logout after inactivity
                  </p>
                </div>

                <select
                  value={formData.security.sessionTimeout}
                  onChange={(e) =>
                    handleSecurityChange(
                      "sessionTimeout",
                      Number(e.target.value),
                    )
                  }
                  className="w-full sm:w-44 px-4 py-3 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500"
                >
                  <option value={5}>5 Minutes</option>

                  <option value={15}>15 Minutes</option>

                  <option value={30}>30 Minutes</option>

                  <option value={60}>60 Minutes</option>

                  <option value={120}>120 Minutes</option>

                  <option value={480}>8 Hours</option>
                </select>
              </div>

              {/* Minimum Password Length */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-800">
                    Minimum Password Length
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    Set minimum number of characters
                  </p>
                </div>

                <input
                  type="number"
                  min="6"
                  max="32"
                  value={formData.security.minimumPasswordLength}
                  onChange={(e) =>
                    handleSecurityChange(
                      "minimumPasswordLength",
                      Number(e.target.value),
                    )
                  }
                  className="w-full sm:w-44 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500"
                />
              </div>

              {/* Strong Password */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-800">
                    Require Strong Password
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    Include numbers, symbols and mixed case letters
                  </p>
                </div>

                <Toggle
                  checked={formData.security.requireStrongPassword}
                  onChange={(value) =>
                    handleSecurityChange("requireStrongPassword", value)
                  }
                  label="Require strong password"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting || saving}
            className="px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <i
              className={`fas ${
                resetting ? "fa-spinner fa-spin" : "fa-sync-alt"
              }`}
            />
            Reset
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <i className={`fas ${saving ? "fa-spinner fa-spin" : "fa-save"}`} />

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    );
};

/* =========================
   Toggle
========================= */

const Toggle = ({
    checked,
    onChange,
    label
}) => {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            aria-label={label}
            aria-pressed={checked}
            className={`relative w-12 h-7 rounded-full transition-all duration-300 flex-shrink-0 ${
                checked
                    ? "bg-violet-600"
                    : "bg-gray-300"
            }`}
        >
            <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${
                    checked
                        ? "left-6"
                        : "left-1"
                }`}
            />
        </button>
    );
};

/* =========================
   Section Icon
========================= */

const SectionIcon = ({ icon }) => {
    return (
        <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
            <i
                className={`fas ${icon} text-violet-600 text-lg`}
            />
        </div>
    );
};

/* =========================
   Notification Setting
========================= */

const NotificationSetting = ({
    title,
    description,
    checked,
    onChange
}) => {
    return (
        <div className="flex items-center justify-between gap-5">

            <div>
                <h3 className="text-sm font-medium text-gray-800">
                    {title}
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                    {description}
                </p>
            </div>

            <Toggle
                checked={Boolean(checked)}
                onChange={onChange}
                label={title}
            />

        </div>
    );
};

/* =========================
   Preference Row
========================= */

const PreferenceRow = ({
    icon,
    label,
    children
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-[145px_1fr] items-center gap-3">

            <div className="flex items-center gap-3 text-sm text-gray-700">

                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <i
                        className={`fas ${icon} text-gray-600`}
                    />
                </div>

                <span>
                    {label}
                </span>

            </div>

            <div>
                {children}
            </div>

        </div>
    );
};

export default Settings;