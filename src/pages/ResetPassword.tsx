import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { Lock, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import logoTanjungpinang from "@/assets/logo_tanjungpinang.png"

export default function ResetPassword() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        // Check if we have a session (handled by auto-redirect from magic link)
        // supabase.auth.onAuthStateChange will handle the session recovery from the URL fragment

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            // If user just clicked the link, they should be signed in.
            // If not, they might need to click the link again.
            if (!session) {
                // However, sometimes it takes a moment.
            }
        }
        checkSession()
    }, [])

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error("Password tidak sama")
            return
        }

        if (password.length < 6) {
            toast.error("Password minimal 6 karakter")
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            setSuccess(true)
            toast.success("Password berhasil diperbarui")

            setTimeout(() => {
                navigate("/")
            }, 3000)
        } catch (error: any) {
            toast.error("Gagal memperbarui password: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-700">Berhasil!</CardTitle>
                        <CardDescription>
                            Password Anda telah berhasil diperbarui.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">
                            Anda akan dialihkan ke halaman login dalam 3 detik...
                        </p>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Button onClick={() => navigate("/")} className="w-full">
                            Ke Halaman Login Sekarang
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-amber-500">
                <CardHeader className="space-y-1 items-center text-center">
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-2">
                        <img src={logoTanjungpinang} alt="Logo" className="w-10 h-10 object-contain" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>
                        Masukkan password baru untuk akun Anda.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password Baru</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Minimal 6 karakter"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Ulangi password baru"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
                            {loading ? "Memperbarui..." : "Simpan Password Baru"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
