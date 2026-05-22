import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authAPI } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'

export default function Settings() {
  const { user, setUser } = useAuthStore()
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
    }
  }, [user])

  const profile = useMutation({
    mutationFn: () => authAPI.updateProfile({ firstName, lastName }),
    onSuccess: (res) => {
      setUser(res.data.data)
      toast.success('Profile updated')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const changePassword = useMutation({
    mutationFn: () => authAPI.changePassword(currentPwd, newPwd),
    onSuccess: () => {
      toast.success('Password changed')
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const handlePasswordSubmit = () => {
    if (newPwd !== confirmPwd) {
      toast.error('Passwords do not match')
      return
    }
    if (newPwd.length < 8 || !/[A-Z]/.test(newPwd) || !/\d/.test(newPwd)) {
      toast.error('Password needs 8+ characters, one uppercase, one digit')
      return
    }
    changePassword.mutate()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Settings</h1>
        <p className="text-sm text-[#a0a09e] mt-1">Manage your profile and security.</p>
      </div>

      <Card padding="p-5">
        <h2 className="text-sm font-medium text-[#e8e8e6] mb-4">Profile</h2>
        <div className="space-y-4 max-w-md">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <Input label="Email" value={user?.email || ''} disabled />
          <div>
            <Button onClick={() => profile.mutate()} loading={profile.isPending}>
              Save changes
            </Button>
          </div>
        </div>
      </Card>

      <Card padding="p-5">
        <h2 className="text-sm font-medium text-[#e8e8e6] mb-4">Change password</h2>
        <div className="space-y-4 max-w-md">
          <Input
            label="Current password"
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
          />
          <Input
            label="New password"
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
          />
          <div>
            <Button
              variant="secondary"
              onClick={handlePasswordSubmit}
              loading={changePassword.isPending}
              disabled={!currentPwd || !newPwd || !confirmPwd}
            >
              Update password
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
