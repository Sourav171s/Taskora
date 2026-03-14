import { useState, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
  Bell, Clock, Volume2, Palette, Shield, Keyboard, Save, X,
  Lock, LogOut, Camera, User, MapPin, Briefcase, Phone, Calendar,
  Sparkles, Upload, ZoomIn, ZoomOut, RotateCcw,
} from "lucide-react";

const API = "http://localhost:4000/api";

// ── Image crop helper ────────────────────────────────────────────────────────
function getCroppedImg(imageSrc: string, crop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const size = Math.min(crop.width, crop.height);
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(
        image,
        crop.x, crop.y, size, size,
        0, 0, 400, 400
      );
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas to Blob failed"));
      }, "image/jpeg", 0.92);
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}

export function Profile() {
  const { user, token, setUser, logout } = useAuth();
  const { settings, updateSetting } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile form
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    age: user?.age?.toString() || "",
    gender: user?.gender || "",
    bio: user?.bio || "",
    phone: user?.phone || "",
    location: user?.location || "",
    occupation: user?.occupation || "",
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
  });

  const [passData, setPassData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });

  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const avatarUrl = user?.avatar
    ? user.avatar.startsWith("http") ? user.avatar : `http://localhost:4000${user.avatar}`
    : null;

  // ── Image selection ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be under 5MB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCropper(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!imageSrc || !croppedArea) return;
    try {
      setUploadingAvatar(true);
      const blob = await getCroppedImg(imageSrc, croppedArea);
      const formData = new FormData();
      formData.append("avatar", blob, "avatar.jpg");

      const res = await fetch(`${API}/user/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUser({ ...user!, avatar: data.avatar });
        setMessage({ type: "success", text: "Profile picture updated!" });
      } else {
        setMessage({ type: "error", text: data.message || "Upload failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to upload. Try again." });
    } finally {
      setUploadingAvatar(false);
      setShowCropper(false);
      setImageSrc(null);
    }
  };

  // ── Profile save ──
  const handleProfileSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setMessage({ type: "error", text: "Name and email are required." });
      return;
    }
    try {
      setLoading(true);
      setMessage(null);
      const body: Record<string, unknown> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        bio: formData.bio.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        occupation: formData.occupation.trim(),
        gender: formData.gender || null,
      };
      if (formData.age) body.age = parseInt(formData.age);
      if (formData.dateOfBirth) body.dateOfBirth = formData.dateOfBirth;

      const res = await fetch(`${API}/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setUser({ ...user!, ...data.user });
        setIsEditing(false);
        setMessage({ type: "success", text: "Profile updated successfully!" });
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    if (passData.newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }
    if (passData.newPassword !== passData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords don't match." });
      return;
    }
    try {
      setLoading(true);
      setMessage(null);
      const res = await fetch(`${API}/user/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passData.oldPassword, newPassword: passData.newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setIsChangingPass(false);
        setPassData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setMessage({ type: "success", text: "Password changed!" });
      } else {
        setMessage({ type: "error", text: data.message || "Failed to change password." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  };

  // Toggle component
  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className="w-8 h-[18px] rounded-full relative transition-colors"
      style={{ background: checked ? "#7C5CFF" : "#1e1e2d" }}
    >
      <div
        className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all"
        style={{ left: checked ? 16 : 2 }}
      />
    </button>
  );

  const inputClass = "w-full bg-secondary text-foreground text-sm px-3 py-2 rounded-lg outline-none border border-border focus:border-primary/50 transition-colors";

  return (
    <div className="max-w-[720px] space-y-4">
      <div>
        <h1 className="text-foreground" style={{ fontSize: 18, fontWeight: 600 }}>Profile & Settings</h1>
        <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>Manage your account, preferences, and settings.</p>
      </div>

      {message && (
        <div
          className={`px-4 py-2.5 rounded-lg text-sm flex items-center justify-between ${
            message.type === "success"
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="p-0.5 rounded hover:bg-white/5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ══════════════ IMAGE CROP MODAL ══════════════ */}
      {showCropper && imageSrc && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-foreground font-semibold" style={{ fontSize: 14 }}>Crop & Resize</h3>
              </div>
              <button onClick={() => { setShowCropper(false); setImageSrc(null); }} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Crop area */}
            <div className="relative w-full" style={{ height: 320 }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Controls */}
            <div className="px-5 py-3 space-y-3 border-t border-border">
              {/* Zoom */}
              <div className="flex items-center gap-3">
                <ZoomOut className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <ZoomIn className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </div>

              {/* Rotation */}
              <div className="flex items-center gap-3">
                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-muted-foreground w-10 text-right" style={{ fontSize: 11 }}>{rotation}°</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setShowCropper(false); setImageSrc(null); }}
                  className="flex-1 px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-sm font-medium hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropSave}
                  disabled={uploadingAvatar}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploadingAvatar ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" /> Save Photo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ PROFILE CARD ══════════════ */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-start gap-4">
          {/* Avatar with upload */}
          <div className="relative group shrink-0">
            <div
              className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden ring-2 ring-border"
              style={{ background: avatarUrl ? "transparent" : undefined }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} className="w-full h-full rounded-full object-cover" alt="avatar" />
              ) : (
                <span className="text-primary" style={{ fontSize: 24, fontWeight: 600 }}>{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
            {/* Online badge */}
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full border-2 border-card" />
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground block mb-1" style={{ fontSize: 10.5 }}>Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={inputClass}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1" style={{ fontSize: 10.5 }}>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={inputClass}
                      placeholder="you@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-muted-foreground block mb-1 flex items-center gap-1" style={{ fontSize: 10.5 }}>
                      <Calendar className="w-3 h-3" /> Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1 flex items-center gap-1" style={{ fontSize: 10.5 }}>
                      <User className="w-3 h-3" /> Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-Binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1 flex items-center gap-1" style={{ fontSize: 10.5 }}>
                      <Phone className="w-3 h-3" /> Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={inputClass}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground block mb-1 flex items-center gap-1" style={{ fontSize: 10.5 }}>
                      <MapPin className="w-3 h-3" /> Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className={inputClass}
                      placeholder="City, Country"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1 flex items-center gap-1" style={{ fontSize: 10.5 }}>
                      <Briefcase className="w-3 h-3" /> Occupation
                    </label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      className={inputClass}
                      placeholder="Student, Developer, etc."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1" style={{ fontSize: 10.5 }}>Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, 200) })}
                    className={inputClass + " resize-none"}
                    rows={2}
                    placeholder="A few words about yourself..."
                  />
                  <span className="text-muted-foreground block text-right mt-0.5" style={{ fontSize: 10 }}>
                    {formData.bio.length}/200
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-foreground" style={{ fontSize: 18, fontWeight: 600 }}>{user?.name}</p>
                <p className="text-muted-foreground" style={{ fontSize: 12.5 }}>{user?.email}</p>
                {user?.bio && (
                  <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>"{user.bio}"</p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  {user?.occupation && (
                    <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: 11.5 }}>
                      <Briefcase className="w-3 h-3" /> {user.occupation}
                    </span>
                  )}
                  {user?.location && (
                    <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: 11.5 }}>
                      <MapPin className="w-3 h-3" /> {user.location}
                    </span>
                  )}
                  {user?.gender && user.gender !== "prefer-not-to-say" && (
                    <span className="text-muted-foreground flex items-center gap-1 capitalize" style={{ fontSize: 11.5 }}>
                      <User className="w-3 h-3" /> {user.gender}
                    </span>
                  )}
                  {user?.dateOfBirth && (
                    <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: 11.5 }}>
                      <Calendar className="w-3 h-3" /> {new Date(user.dateOfBirth).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-primary bg-primary/10 px-2 py-0.5 rounded" style={{ fontSize: 11, fontWeight: 500 }}>
                    Pro Plan
                  </span>
                  <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                    Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Edit/Save buttons */}
          <div className="flex flex-col gap-2 shrink-0">
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: user?.name || "", email: user?.email || "",
                      age: user?.age?.toString() || "", gender: user?.gender || "",
                      bio: user?.bio || "", phone: user?.phone || "",
                      location: user?.location || "", occupation: user?.occupation || "",
                      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
                    });
                  }}
                  disabled={loading}
                  className="text-muted-foreground hover:bg-secondary p-1.5 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleProfileSave}
                  disabled={loading}
                  className="text-green-500 hover:bg-green-500/10 p-1.5 rounded-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground hover:text-foreground px-3 py-1.5 border border-border rounded-md transition-colors text-xs font-medium"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="pt-4 mt-4 border-t border-border">
          {isChangingPass ? (
            <div>
              <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" /> Change Password
              </p>
              <div className="space-y-2 max-w-[400px]">
                <input type="password" placeholder="Current password" value={passData.oldPassword} onChange={(e) => setPassData({ ...passData, oldPassword: e.target.value })} className={inputClass} />
                <input type="password" placeholder="New password (min 6 chars)" value={passData.newPassword} onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })} className={inputClass} />
                <input type="password" placeholder="Confirm new password" value={passData.confirmPassword} onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })} className={inputClass} />
                <div className="flex gap-2 pt-1">
                  <button onClick={handlePasswordSave} disabled={loading} className="px-4 py-1.5 bg-primary text-white text-sm rounded-md font-medium hover:bg-primary/90 transition-colors">
                    {loading ? "Saving..." : "Update Password"}
                  </button>
                  <button onClick={() => { setIsChangingPass(false); setPassData({ oldPassword: "", newPassword: "", confirmPassword: "" }); }} className="px-4 py-1.5 bg-secondary text-muted-foreground text-sm rounded-md hover:text-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsChangingPass(true)} className="text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors">
              <Lock className="w-3.5 h-3.5" /> Change Password
            </button>
          )}
        </div>
      </div>

      {/* ══════════════ SETTINGS CARDS (unchanged) ══════════════ */}

      {/* Focus Settings */}
      <div className="bg-card border border-border rounded-lg">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-foreground" style={{ fontSize: 13, fontWeight: 500 }}>Focus</h3>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-4 h-11">
            <span className="text-foreground" style={{ fontSize: 13 }}>Focus duration</span>
            <select value={settings.focusDuration} onChange={(e) => updateSetting("focusDuration", e.target.value)} className="bg-secondary text-foreground px-2 py-1 rounded border border-border text-xs outline-none">
              {["15", "20", "25", "30", "45", "60"].map((v) => <option key={v} value={v}>{v} min</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between px-4 h-11">
            <span className="text-foreground" style={{ fontSize: 13 }}>Short break</span>
            <select value={settings.shortBreak} onChange={(e) => updateSetting("shortBreak", e.target.value)} className="bg-secondary text-foreground px-2 py-1 rounded border border-border text-xs outline-none">
              {["3", "5", "10", "15"].map((v) => <option key={v} value={v}>{v} min</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between px-4 h-11">
            <span className="text-foreground" style={{ fontSize: 13 }}>Long break</span>
            <select value={settings.longBreak} onChange={(e) => updateSetting("longBreak", e.target.value)} className="bg-secondary text-foreground px-2 py-1 rounded border border-border text-xs outline-none">
              {["10", "15", "20", "30"].map((v) => <option key={v} value={v}>{v} min</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between px-4 h-11">
            <span className="text-foreground" style={{ fontSize: 13 }}>Sessions before long break</span>
            <select value={settings.sessionsBeforeLong} onChange={(e) => updateSetting("sessionsBeforeLong", e.target.value)} className="bg-secondary text-foreground px-2 py-1 rounded border border-border text-xs outline-none">
              {["2", "3", "4", "5", "6"].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between px-4 h-11">
            <span className="text-foreground" style={{ fontSize: 13 }}>Auto-start breaks</span>
            <Toggle checked={settings.autoStartBreaks} onChange={(v) => updateSetting("autoStartBreaks", v)} />
          </div>
        </div>
      </div>

      {/* Sound Settings */}
      <div className="bg-card border border-border rounded-lg">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Volume2 className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-foreground" style={{ fontSize: 13, fontWeight: 500 }}>Sound</h3>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-4 h-11">
            <span className="text-foreground" style={{ fontSize: 13 }}>Default sound</span>
            <select value={settings.defaultSound} onChange={(e) => updateSetting("defaultSound", e.target.value)} className="bg-secondary text-foreground px-2 py-1 rounded border border-border text-xs outline-none">
              {["Rain", "Cafe", "Forest", "Fire", "Underwater", "Ocean", "Storm"].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between px-4 h-11">
            <span className="text-foreground" style={{ fontSize: 13 }}>Default volume</span>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={100} value={settings.defaultVolume} onChange={(e) => updateSetting("defaultVolume", e.target.value)} className="w-20 accent-primary" />
              <span className="text-muted-foreground w-8 text-right" style={{ fontSize: 11 }}>{settings.defaultVolume}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 h-11">
            <span className="text-foreground" style={{ fontSize: 13 }}>Notification sound</span>
            <Toggle checked={settings.notificationSound} onChange={(v) => updateSetting("notificationSound", v)} />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-card border border-border rounded-lg">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Bell className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-foreground" style={{ fontSize: 13, fontWeight: 500 }}>Notifications</h3>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-4 h-11">
            <span className="text-foreground" style={{ fontSize: 13 }}>Session reminders</span>
            <Toggle checked={settings.sessionReminders} onChange={(v) => updateSetting("sessionReminders", v)} />
          </div>
          <div className="flex items-center justify-between px-4 h-11">
            <span className="text-foreground" style={{ fontSize: 13 }}>Daily summary</span>
            <Toggle checked={settings.dailySummary} onChange={(v) => updateSetting("dailySummary", v)} />
          </div>
          <div className="flex items-center justify-between px-4 h-11">
            <span className="text-foreground" style={{ fontSize: 13 }}>Streak alerts</span>
            <Toggle checked={settings.streakAlerts} onChange={(v) => updateSetting("streakAlerts", v)} />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-card border border-border rounded-lg">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Palette className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-foreground" style={{ fontSize: 13, fontWeight: 500 }}>Appearance</h3>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-4 h-11">
            <span className="text-foreground" style={{ fontSize: 13 }}>Theme</span>
            <select value={settings.theme} onChange={(e) => updateSetting("theme", e.target.value as any)} className="bg-secondary text-foreground px-2 py-1 rounded border border-border text-xs outline-none">
              <option value="Dark">Dark</option>
              <option value="Light">Light</option>
              <option value="System">System</option>
            </select>
          </div>
          <div className="flex items-center justify-between px-4 h-11">
            <span className="text-foreground" style={{ fontSize: 13 }}>Accent color</span>
            <div className="flex items-center gap-1.5">
              {[
                { name: "Purple", color: "#8b5cf6" },
                { name: "Blue", color: "#3b82f6" },
                { name: "Green", color: "#22c55e" },
                { name: "Orange", color: "#f59e0b" },
                { name: "Pink", color: "#ec4899" },
              ].map((c) => (
                <button
                  key={c.name}
                  onClick={() => updateSetting("accentColor", c.name as any)}
                  className="w-5 h-5 rounded-full transition-all"
                  style={{
                    background: c.color,
                    boxShadow: settings.accentColor === c.name ? `0 0 0 2px #0E0E16, 0 0 0 3.5px ${c.color}` : "none",
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between px-4 h-11">
            <span className="text-foreground" style={{ fontSize: 13 }}>Compact mode</span>
            <Toggle checked={settings.compactMode} onChange={(v) => updateSetting("compactMode", v)} />
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <div className="bg-card border border-border rounded-lg">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Keyboard className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-foreground" style={{ fontSize: 13, fontWeight: 500 }}>Keyboard Shortcuts</h3>
        </div>
        <div className="divide-y divide-border">
          {[
            { key: "Ctrl K", desc: "Toggle Kora Agent" },
            { key: "Space", desc: "Pause / Resume focus" },
            { key: "Esc", desc: "Exit focus mode" },
            { key: "Ctrl N", desc: "New task" },
          ].map((s) => (
            <div key={s.key} className="flex items-center justify-between px-4 h-10">
              <span className="text-foreground" style={{ fontSize: 13 }}>{s.desc}</span>
              <kbd className="text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border" style={{ fontSize: 11 }}>
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="pt-4 border-t border-border mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground" style={{ fontSize: 12, fontWeight: 500 }}>Account Actions</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground px-3 py-1.5 border border-border rounded-md transition-colors"
            style={{ fontSize: 12.5 }}
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
          <button className="text-muted-foreground hover:text-foreground px-3 py-1.5 border border-border rounded-md transition-colors" style={{ fontSize: 12.5 }}>
            Export Data
          </button>
          <button className="text-destructive hover:text-destructive/80 px-3 py-1.5 border border-destructive/20 rounded-md transition-colors" style={{ fontSize: 12.5 }}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}