import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

export const Settings = () => {
  const { user, updateUser } = useAuthStore();

  // Profile Form States
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) {
      setProfileMsg({ type: 'error', text: 'First name and email are required' });
      return;
    }
    setProfileMsg(null);
    setIsUpdatingProfile(true);
    try {
      const response = await authService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      updateUser(response.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile info',
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'All password fields are required' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long' });
      return;
    }
    setPasswordMsg(null);
    setIsUpdatingPassword(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update password',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <main className="flex-1 h-full overflow-y-auto bg-[#f5f5f7] p-8 md:p-12 font-sans text-[#1d1d1f]">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 border-b border-[#e8e8ed] pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">Account Settings</h1>
          <p className="text-[14px] text-[#86868b] mt-1.5">
            Manage your personal details, email credentials, and security preferences.
          </p>
        </div>

        {/* Account Badge */}
        {user && (
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-[#e8e8ed] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container font-bold text-xs flex items-center justify-center">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-[#1d1d1f]">@{user.username}</span>
          </div>
        )}
      </header>

      <div className="flex flex-col gap-8 max-w-4xl">
        {/* Profile Card */}
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-[#e8e8ed] flex flex-col gap-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 border-b border-[#f5f5f7] pb-4">
            <div className="w-9 h-9 rounded-xl bg-[#f5f5f7] flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-sm">manage_accounts</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1d1d1f]">Profile Details</h2>
              <p className="text-xs text-[#86868b] mt-0.5">Update workspace contact credentials and personal information.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
            {profileMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 border ${
                  profileMsg.type === 'success'
                    ? 'bg-green-50 text-green-700 border-green-200/60'
                    : 'bg-red-50 text-red-700 border-red-200/60'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {profileMsg.type === 'success' ? 'check_circle' : 'error'}
                </span>
                {profileMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1d1d1f]">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isUpdatingProfile}
                  placeholder="First Name"
                  className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl px-4 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1d1d1f]">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isUpdatingProfile}
                  placeholder="Last Name"
                  className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl px-4 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f]">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isUpdatingProfile}
                placeholder="name@example.com"
                className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl px-4 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-5 py-2.5 bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                {isUpdatingProfile ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </section>

        {/* Security Card */}
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-[#e8e8ed] flex flex-col gap-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 border-b border-[#f5f5f7] pb-4">
            <div className="w-9 h-9 rounded-xl bg-[#f5f5f7] flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-sm">lock_open</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1d1d1f]">Password &amp; Security</h2>
              <p className="text-xs text-[#86868b] mt-0.5">Update your password to keep your account secure.</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
            {passwordMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 border ${
                  passwordMsg.type === 'success'
                    ? 'bg-green-50 text-green-700 border-green-200/60'
                    : 'bg-red-50 text-red-700 border-red-200/60'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {passwordMsg.type === 'success' ? 'check_circle' : 'error'}
                </span>
                {passwordMsg.text}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f]">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isUpdatingPassword}
                placeholder="••••••••"
                className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl px-4 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1d1d1f]">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isUpdatingPassword}
                  placeholder="At least 8 characters"
                  className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl px-4 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1d1d1f]">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isUpdatingPassword}
                  placeholder="Repeat new password"
                  className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl px-4 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-5 py-2.5 bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                {isUpdatingPassword ? 'Updating Password...' : 'Change Password'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};
