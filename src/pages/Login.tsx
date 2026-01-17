import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { User, Lock } from "lucide-react"
import logoTanjungpinang from "@/assets/logo_tanjungpinang.png"

export default function Login() {
    const [userId, setUserId] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: userId,
                password,
            })

            if (error) {
                throw error
            }

            navigate("/dashboard")
        } catch (err: any) {
            setError(err.message || "Gagal masuk. Periksa User ID dan Password.")
        } finally {
            setLoading(false)
        }
    }

    const bypassLogin = () => {
        navigate("/dashboard")
    }

    return (
        <div className="min-h-screen w-full flex font-sans bg-white">
            {/* Left Side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
                            <img
                                src={logoTanjungpinang}
                                alt="Logo"
                                className="w-8 h-8 object-contain"
                            />
                        </div>
                        <span className="text-xl font-semibold tracking-wide text-white/90">Dinas Kependudukan</span>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Sistem Informasi <br />
                        <span className="text-amber-400">Arsip Digital</span>
                    </h1>
                    <p className="text-lg text-slate-300 leading-relaxed mb-8">
                        Platform terintegrasi untuk pengelolaan data kependudukan dan pencatatan sipil Kota Tanjungpinang. Aman, Cepat, dan Efisien.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-slate-400">
                    &copy; {new Date().getFullYear()} Pemerintah Kota Tanjungpinang
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50/50">
                <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 lg:border-none lg:shadow-none lg:bg-transparent">
                    {/* Mobile Logo (Visible only on mobile) */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center p-2 mb-4">
                            <img
                                src={logoTanjungpinang}
                                alt="Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Selamat Datang</h2>
                        <p className="text-slate-500 mt-2">Silakan masuk untuk melanjutkan akses.</p>
                    </div>

                    {error && (
                        <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3">
                            <div className="w-1 h-8 bg-red-500 rounded-full"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">User ID</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Masukkan User ID Anda"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-semibold text-slate-700">Password</label>
                                <a href="#" className="text-xs font-medium text-amber-600 hover:text-amber-700 hover:underline">
                                    Lupa Password?
                                </a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    placeholder="Masukkan Password Anda"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Memproses...
                                </span>
                            ) : "Masuk ke Dashboard"}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white lg:bg-gray-50/50 text-slate-500 font-medium">Atau lanjutkan dengan</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1">
                        <button
                            type="button"
                            className="flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl hover:bg-white hover:shadow-md transition-all bg-white"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="text-sm font-semibold text-slate-600">Google Account</span>
                        </button>
                    </div>

                    <div className="pt-4 text-center">
                        <button
                            onClick={bypassLogin}
                            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            (Mode Demo: Klik untuk masuk tanpa login)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
