import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Lock } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarColor, getInitials } from '@/lib/format'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  changePassword,
  getErrorMessage,
  removeMyAvatar,
  updateMyProfile,
  uploadMyAvatar,
} from '@/lib/api'
import { JOB_ROLES } from '@/lib/types'

type Tab = 'Profile' | 'Notifications' | 'Workspace' | 'Security'

const TIMEZONES = [
  'GMT+05:30 - Chennai',
  'GMT+00:00 - UTC',
  'GMT-05:00 - New York',
  'GMT-08:00 - Los Angeles',
  'GMT+01:00 - London',
  'GMT+08:00 - Singapore',
]

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('Profile')
  const [fullName, setFullName] = useState(user?.name ?? '')
  const [jobRole, setJobRole] = useState(user?.jobRole ?? 'Engineer')
  const [timezone, setTimezone] = useState('GMT+05:30 - Chennai')
  const [notifyTaskAssigned, setNotifyTaskAssigned] = useState(true)
  const [notifyMentions, setNotifyMentions] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tabs: Tab[] = ['Profile', 'Notifications', 'Workspace', 'Security']

  const handleSaveProfile = async () => {
    try {
      const updated = await updateMyProfile(
        user?.role === 'admin' ? { name: fullName } : { name: fullName, jobRole }
      )
      updateUser(updated)
      setFullName(updated.name)
      setJobRole(updated.jobRole)
      toast.success('Profile saved')
    } catch {
      toast.error('Could not save your profile. Please try again.')
    }
  }

  const handleAvatarSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Choose a PNG, JPEG, or WebP image.')
      return
    }
    if (file.size > 1024 * 1024) {
      toast.error('Image must be 1 MB or smaller.')
      return
    }

    setUploadingAvatar(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Could not read image'))
        reader.readAsDataURL(file)
      })
      const updated = await uploadMyAvatar(dataUrl)
      updateUser(updated)
      toast.success('Profile photo uploaded')
    } catch {
      toast.error('Could not upload the photo. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user?.avatarUrl) return
    setUploadingAvatar(true)
    try {
      const updated = await removeMyAvatar()
      updateUser(updated)
      toast.success('Profile photo removed')
    } catch {
      toast.error('Could not remove the photo. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleChangePassword = async () => {
    setUpdatingPassword(true)
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password updated. Use your new password next time you sign in.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setUpdatingPassword(false)
    }
  }

  const inputClass = 'w-full rounded-md border border-[#e1e4e7] bg-white px-3 py-2 text-[13px] text-[#111315] outline-none focus:border-[#111315] transition-colors'
  const disabledInputClass = 'w-full rounded-md border border-[#e7e9eb] bg-[#f7f8f9] px-3 py-2 text-[13px] text-[#9ca3af] outline-none cursor-not-allowed'
  const selectClass = 'w-full rounded-md border border-[#e1e4e7] bg-white px-3 py-2 text-[13px] text-[#111315] outline-none focus:border-[#111315]'
  const labelClass = 'mb-1.5 block text-[11px] font-semibold text-[#374151]'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-[12px] text-[#7a838b]">Manage your profile and notification preferences.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#e2e5e8]">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 pb-3 pt-1 text-[12px] font-semibold transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-[#111315] text-[#111315]'
                  : 'text-[#8a9299] hover:text-[#374151]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
        {/* Left content */}
        <div className="space-y-5">
          {activeTab === 'Profile' && (
            <div className="rounded-lg border border-[#e2e5e8] bg-white p-6">
              <h2 className="text-[13px] font-bold text-[#111315]">Profile</h2>
              <p className="mt-1 text-[11px] text-[#9ca3af]">This information is visible to your team.</p>

              {/* Avatar */}
              <div className="mt-5 flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`${user.name}'s profile`} />}
                  <AvatarFallback className={`${getAvatarColor(user?.name ?? '')} text-[14px] font-semibold text-white`}>
                    {getInitials(user?.name ?? '')}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarSelected}
                />
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-md border border-[#e1e4e7] px-3 py-1.5 text-[11px] font-semibold text-[#374151] hover:bg-[#f7f7f8] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingAvatar ? 'Uploading...' : 'Upload photo'}
                </button>
                <button
                  type="button"
                  disabled={!user?.avatarUrl || uploadingAvatar}
                  onClick={handleRemoveAvatar}
                  className="text-[11px] text-[#9ca3af] hover:text-[#374151] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              {/* Form */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Full name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <div className="relative">
                    <input
                      value={user?.email ?? ''}
                      disabled
                      className={disabledInputClass}
                    />
                    <Lock className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9ca3af]" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Role</label>
                  {user?.role === 'admin' ? (
                    <>
                      <div className="relative">
                        <input value="Admin" disabled className={disabledInputClass} />
                        <Lock className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9ca3af]" />
                      </div>
                      <p className="mt-1 text-[10px] text-[#9ca3af]">
                        Admin access is managed by the workspace.
                      </p>
                    </>
                  ) : (
                    <>
                      <select
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value as typeof jobRole)}
                        className={selectClass}
                      >
                        {JOB_ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <p className="mt-1 text-[10px] text-[#9ca3af]">
                        Choose the role you want your team to see.
                      </p>
                    </>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Timezone</label>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={selectClass}>
                    {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setFullName(user?.name ?? '')
                    setJobRole(user?.jobRole ?? 'Engineer')
                  }}
                  className="rounded-md border border-[#e1e4e7] px-4 py-1.5 text-[12px] font-medium text-[#374151] hover:bg-[#f7f7f8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="rounded-md bg-[#111315] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#2b2e31] transition-colors"
                >
                  Save changes
                </button>
              </div>
            </div>
          )}

          {(activeTab === 'Profile' || activeTab === 'Notifications') && (
            <div className="rounded-lg border border-[#e2e5e8] bg-white p-6">
              <h2 className="text-[13px] font-bold text-[#111315]">Notifications</h2>
              <p className="mt-1 text-[11px] text-[#9ca3af]">Choose what TaskFlow emails you about.</p>

              <div className="mt-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-[#374151]">Task assigned to me</p>
                    <p className="text-[11px] text-[#9ca3af]">Email me when someone assigns a task.</p>
                  </div>
                  <Switch checked={notifyTaskAssigned} onCheckedChange={setNotifyTaskAssigned} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-[#374151]">Comment mentions</p>
                    <p className="text-[11px] text-[#9ca3af]">Email me when I'm @mentioned.</p>
                  </div>
                  <Switch checked={notifyMentions} onCheckedChange={setNotifyMentions} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Workspace' && (
            <div className="rounded-lg border border-[#e2e5e8] bg-white p-6">
              <h2 className="text-[13px] font-bold text-[#111315]">Workspace</h2>
              <p className="mt-1 text-[11px] text-[#9ca3af]">Manage your workspace settings.</p>
              <p className="mt-6 text-[12px] text-[#9ca3af]">No workspace settings configured yet.</p>
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="rounded-lg border border-[#e2e5e8] bg-white p-6">
              <h2 className="text-[13px] font-bold text-[#111315]">Security</h2>
              <p className="mt-1 text-[11px] text-[#9ca3af]">Manage your password and security settings.</p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className={labelClass}>Current password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} autoComplete="current-password" />
                </div>
                <div>
                  <label className={labelClass}>New password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} autoComplete="new-password" />
                </div>
                <div>
                  <label className={labelClass}>Confirm new password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} autoComplete="new-password" />
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={updatingPassword}
                    className="rounded-md bg-[#111315] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#2b2e31] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingPassword ? 'Updating...' : 'Update password'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Account card */}
          <div className="rounded-lg border border-[#e2e5e8] bg-white p-5">
            <h3 className="mb-4 text-[12px] font-semibold text-[#111315]">Account</h3>
            <dl className="space-y-3 text-[12px]">
              <div className="flex items-center justify-between">
                <dt className="text-[#9299a0]">Plan</dt>
                <dd className="font-medium text-[#111315]">Team</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#9299a0]">Members</dt>
                <dd className="font-medium text-[#111315]">5 / 7</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#9299a0]">Member since</dt>
                <dd className="font-medium text-[#111315]">Jan 2026</dd>
              </div>
            </dl>
          </div>

          {/* Sessions card */}
          <div className="rounded-lg border border-[#e2e5e8] bg-white p-5">
            <h3 className="mb-4 text-[12px] font-semibold text-[#111315]">Sessions</h3>
            <div className="space-y-3">
              <div className="text-[11px]">
                <p className="font-medium text-[#356fe8]">Chrome · Chennai · active now</p>
              </div>
              <div className="text-[11px]">
                <p className="font-medium text-[#356fe8]">Safari · Bengaluru · 3 days ago</p>
              </div>
            </div>
            <button
              onClick={() => toast.success('Other devices signed out')}
              className="mt-4 w-full rounded-md border border-[#e1e4e7] py-1.5 text-[11px] font-medium text-[#374151] hover:bg-[#f7f7f8] transition-colors"
            >
              Sign out other devices
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
