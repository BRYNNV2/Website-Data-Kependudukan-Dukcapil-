import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { User, Lock, Mail, Loader2, HelpCircle, PlayCircle } from "lucide-react"

export default function Settings() {
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [fullName, setFullName] = useState("")

    // Password States
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordLoading, setPasswordLoading] = useState(false)

    useEffect(() => {
        getProfile()
    }, [])

    const getProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                setFullName(user.user_metadata?.full_name || "")
            }
        } catch (error) {
            console.error("Error loading user:", error)
        }
    }

    const updateProfile = async () => {
        try {
            setLoading(true)
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            })

            if (error) throw error
            toast.success("Profil berhasil diperbarui!")

            // Force refresh session to propagate changes to Layout
            await supabase.auth.refreshSession()

            // Reload to ensure header updates
            setTimeout(() => {
                window.location.reload()
            }, 1000)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const updatePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("Password baru tidak cocok!")
            return
        }
        if (newPassword.length < 6) {
            toast.error("Password harus minimal 6 karakter")
            return
        }

        try {
            setPasswordLoading(true)
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) throw error
            toast.success("Password berhasil diperbarui!")
            setNewPassword("")
            setConfirmPassword("")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setPasswordLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight text-gray-800">Pengaturan Akun</h3>
                <p className="text-muted-foreground">
                    Kelola informasi profil dan keamanan akun Anda.
                </p>
            </div>

            <div className="grid gap-6">
                {/* Profile Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-600" />
                            Informasi Profil
                        </CardTitle>
                        <CardDescription>
                            Perbarui informasi identitas Anda di sini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    value={user?.email || ""}
                                    disabled
                                    className="pl-9 bg-muted"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Email tidak dapat diubah.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nama Lengkap</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="fullName"
                                    placeholder="Nama Lengkap Anda"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button onClick={updateProfile} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? "Menyimpan..." : "Simpan Perubahan"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Password Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-orange-600" />
                            Ganti Password
                        </CardTitle>
                        <CardDescription>
                            Pastikan password Anda aman dan tidak mudah ditebak.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Password Baru</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                variant="outline"
                                onClick={updatePassword}
                                disabled={passwordLoading || !newPassword}
                                className="border-orange-200 hover:bg-orange-50 text-orange-700"
                            >
                                {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Password
                            </Button>
                        </div>
                    </CardContent>
                </Card>


                {/* Help User Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HelpCircle className="h-5 w-5 text-green-600" />
                            Pusat Bantuan
                        </CardTitle>
                        <CardDescription>
                            Bingung cara menggunakan aplikasi? Mulai tur interaktif kembali.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => {
                                window.location.href = '/dashboard';
                                // Use setTimeout to allow navigation to engage first, then trigger tour
                                // We will handle the auto-start logic in OnboardingTour's useEffect based on a URL param or local storage flag if needed, 
                                // BUT simpler: Dispatch event after small delay if on same page logic, or better:
                                // Let's use a localStorage flag that OnboardingTour checks on mount "force_tour_start"
                                localStorage.setItem('force_tour_restart', 'true');
                            }}
                            variant="secondary"
                            className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                        >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Mulai Panduan Aplikasi
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
