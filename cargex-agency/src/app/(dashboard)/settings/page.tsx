"use client";

import { useState, useEffect } from "react";
import { User, Lock, Shield, CheckCircle, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgency } from "@/context/AgencyContext";

export default function SettingsPage() {
  const { api, user, login } = useAgency();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "account">("profile");

  // Profile Form States
  const [profileData, setProfileData] = useState({
    name: "",
    ownerName: "",
    phone: "",
    email: ""
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password Form States
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Populate profile form on load
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        ownerName: user.ownerName || "",
        phone: (user as any).phone || "",
        email: user.email || ""
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess("");
    setProfileError("");
    try {
      const res = await api.put("/api/agency/profile", {
        name: profileData.name,
        ownerName: profileData.ownerName,
        phone: profileData.phone
      });
      setProfileSuccess("Profile updated successfully!");
      // Sync local storage context user state
      const token = localStorage.getItem("agencyToken") || "";
      login(token, res.data.data);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setPasswordLoading(true);
    setPasswordSuccess("");
    setPasswordError("");
    try {
      await api.put("/api/agency/password", {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordSuccess("Password changed successfully!");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || "Incorrect current password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Agency Settings</h1>
        <p className="text-zinc-400 mt-1">Configure profile, security credentials, and view account status.</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-zinc-800 gap-6">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "profile" ? "border-blue-500 text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <User className="w-4 h-4" /> Profile Details
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "security" ? "border-blue-500 text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Lock className="w-4 h-4" /> Security & Passwords
        </button>
        <button
          onClick={() => setActiveTab("account")}
          className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "account" ? "border-blue-500 text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Shield className="w-4 h-4" /> Account Verification
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "profile" && (
        <Card className="bg-zinc-950 border-zinc-800 text-white max-w-2xl shadow-xl">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription className="text-zinc-500">Update agency name, owners, and contact numbers.</CardDescription>
          </CardHeader>
          <CardContent>
            {profileSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" /> {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Agency Name</label>
                <Input
                  type="text"
                  required
                  className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Owner Name</label>
                <Input
                  type="text"
                  required
                  className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                  value={profileData.ownerName}
                  onChange={(e) => setProfileData({ ...profileData, ownerName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Phone Number</label>
                  <Input
                    type="tel"
                    required
                    className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Registered Email (Read Only)</label>
                  <Input
                    type="email"
                    disabled
                    className="bg-zinc-900 border-zinc-800 text-zinc-500 cursor-not-allowed"
                    value={profileData.email}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <Button
                  type="submit"
                  disabled={profileLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> {profileLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "security" && (
        <Card className="bg-zinc-950 border-zinc-800 text-white max-w-2xl shadow-xl">
          <CardHeader>
            <CardTitle>Update Password</CardTitle>
            <CardDescription className="text-zinc-500">Ensure your agency account remains secure.</CardDescription>
          </CardHeader>
          <CardContent>
            {passwordSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" /> {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Current Password</label>
                <Input
                  type="password"
                  required
                  placeholder="Enter current password"
                  className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">New Password</label>
                  <Input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Confirm New Password</label>
                  <Input
                    type="password"
                    required
                    placeholder="Repeat new password"
                    className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <Button
                  type="submit"
                  disabled={passwordLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> {passwordLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "account" && (
        <Card className="bg-zinc-950 border-zinc-800 text-white max-w-2xl shadow-xl">
          <CardHeader>
            <CardTitle>Verification & Credentials</CardTitle>
            <CardDescription className="text-zinc-500">Monitor verification status and active credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <Shield className={`w-12 h-12 ${user?.status === "active" ? "text-green-500" : "text-yellow-500"}`} />
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Account Status: <span className="capitalize">{user?.status || "Active"}</span>
                </h3>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Your Cargex logistics agency profile is fully vetted, approved, and verified to operate.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Agency ID Token Scope</h4>
              <div className="bg-zinc-900 px-4 py-3 rounded-lg border border-zinc-800 font-mono text-xs text-zinc-300 break-all select-all">
                agency_token_uid_{user?._id || "unknown_agency_profile"}
              </div>
              <p className="text-xs text-zinc-500">
                This token uniquely identifies your agency fleet. Use it when pairing logistics hardware or requesting driver integration.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
