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
    <main className="flex-1 h-full overflow-y-auto bg-surface-container-lowest p-margin md:p-2xl">
      {/* Header */}
      <header className="mb-xl">
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Account Settings</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
          Manage your account profile information and security settings.
        </p>
      </header>

      <div className="flex flex-col gap-xl max-w-4xl">
        {/* Profile Card */}
        <section className="glass-panel p-lg md:p-xl rounded-xl border border-surface-variant bg-surface-container-lowest flex flex-col gap-md">
          <div className="flex items-center gap-sm border-b border-surface-variant/40 pb-sm">
            <span className="material-symbols-outlined text-primary text-xl">manage_accounts</span>
            <div>
              <h2 className="font-headline-sm text-base font-bold text-on-surface">Profile Details</h2>
              <p className="font-body-md text-xs text-on-surface-variant mt-[2px]">Update workspace contact credentials.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-md">
            {profileMsg && (
              <div
                className={`p-sm rounded-lg font-body-md text-sm border ${
                  profileMsg.type === 'success'
                    ? 'bg-success-container text-on-success-container border-success/20'
                    : 'bg-error-container text-on-error-container border-error/20'
                }`}
              >
                {profileMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-xs text-on-surface font-semibold">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isUpdatingProfile}
                  className="bg-surface-container-lowest border border-surface-variant rounded-lg p-sm font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-xs text-on-surface font-semibold">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isUpdatingProfile}
                  className="bg-surface-container-lowest border border-surface-variant rounded-lg p-sm font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-xs text-on-surface font-semibold">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isUpdatingProfile}
                className="bg-surface-container-lowest border border-surface-variant rounded-lg p-sm font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>

            <div className="flex justify-end mt-sm">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-md py-sm bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary rounded-lg font-label-md text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUpdatingProfile ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </section>

        {/* Security Card */}
        <section className="glass-panel p-lg md:p-xl rounded-xl border border-surface-variant bg-surface-container-lowest flex flex-col gap-md">
          <div className="flex items-center gap-sm border-b border-surface-variant/40 pb-sm">
            <span className="material-symbols-outlined text-primary text-xl">lock_open</span>
            <div>
              <h2 className="font-headline-sm text-base font-bold text-on-surface">Password &amp; Security</h2>
              <p className="font-body-md text-xs text-on-surface-variant mt-[2px]">Change account credentials password.</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-md">
            {passwordMsg && (
              <div
                className={`p-sm rounded-lg font-body-md text-sm border ${
                  passwordMsg.type === 'success'
                    ? 'bg-success-container text-on-success-container border-success/20'
                    : 'bg-error-container text-on-error-container border-error/20'
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-xs text-on-surface font-semibold">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isUpdatingPassword}
                placeholder="••••••••"
                className="bg-surface-container-lowest border border-surface-variant rounded-lg p-sm font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-xs text-on-surface font-semibold">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isUpdatingPassword}
                  placeholder="At least 8 characters"
                  className="bg-surface-container-lowest border border-surface-variant rounded-lg p-sm font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-xs text-on-surface font-semibold">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isUpdatingPassword}
                  placeholder="Repeat new password"
                  className="bg-surface-container-lowest border border-surface-variant rounded-lg p-sm font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end mt-sm">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-md py-sm bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary rounded-lg font-label-md text-sm transition-colors cursor-pointer disabled:opacity-50"
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
