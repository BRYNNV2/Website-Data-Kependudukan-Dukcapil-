import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { User, Lock, Mail, Loader2, PlayCircle, HelpCircle } from "lucide-react"

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

            // Trigger custom event so other components (like Layout) can catch the update independently
            window.dispatchEvent(new Event('profile-updated'));
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
        <div className="space-y-6 pb-10 w-full">
            <div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-800">Pengaturan Akun</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Kelola informasi profil dan keamanan akun Anda.
                </p>
            </div>

            <div className="space-y-6">
                {/* Profile Form Card */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-600" />
                            Informasi Profil
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Perbarui informasi identitas Anda di sini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-semibold text-slate-700 text-sm">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    value={user?.email || ""}
                                    disabled
                                    className="pl-9 bg-slate-50/50 text-slate-500 border-slate-200"
                                />
                            </div>
                            <p className="text-[11px] text-slate-400">Email tidak dapat diubah.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="font-semibold text-slate-700 text-sm">Nama Lengkap</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="fullName"
                                    placeholder="Masukkan Nama Lengkap"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="pl-9 border-slate-200 focus-visible:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button onClick={updateProfile} disabled={loading} className="bg-[#1e293b] hover:bg-slate-800 text-white min-w-[150px]">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? "Menyimpan..." : "Simpan Perubahan"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Password Card */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Lock className="h-5 w-5 text-orange-500" />
                            Ganti Password
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Pastikan password Anda aman dan tidak mudah ditebak.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="font-semibold text-slate-700 text-sm">Password Baru</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="******"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="border-slate-200 focus-visible:ring-orange-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="font-semibold text-slate-700 text-sm">Konfirmasi Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="******"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="border-slate-200 focus-visible:ring-orange-500"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                variant="outline"
                                onClick={updatePassword}
                                disabled={passwordLoading || !newPassword}
                                className="border-orange-200 text-orange-500 hover:bg-orange-50 hover:text-orange-600 min-w-[150px]"
                            >
                                {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Password
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Help Center Card */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <HelpCircle className="h-5 w-5 text-green-600" />
                            Pusat Bantuan
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Bingung cara menggunakan aplikasi? Mulai tur interaktif kembali.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => {
                                window.location.href = '/dashboard';
                                localStorage.setItem('force_tour_restart', 'true');
                            }}
                            className="bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 min-w-[150px]"
                        >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Mulai Panduan Aplikasi
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
