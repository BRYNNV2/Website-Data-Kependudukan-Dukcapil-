import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { User, Lock } from "lucide-react"
import logoTanjungpinang from "@/assets/logo_tanjungpinang.png"
import { toast } from "sonner"

// Import background images from assets
import LoginBg1 from "@/assets/login_bg_1.png"
import LoginBg2 from "@/assets/login_bg_2.jpg"
import LoginBg3 from "@/assets/login_bg_3.jpg"

export default function Login() {
    const [userId, setUserId] = useState("")
    const [password, setPassword] = useState("")
    const [rememberMe, setRememberMe] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const navigate = useNavigate()

    const backgroundImages = [LoginBg1, LoginBg2, LoginBg3]

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length)
        }, 3000) // Change image every 3 seconds

        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const savedUserId = localStorage.getItem("rememberedUserId")
        if (savedUserId) {
            setUserId(savedUserId)
            setRememberMe(true)
        }
    }, [])

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

            if (rememberMe) {
                localStorage.setItem("rememberedUserId", userId)
            } else {
                localStorage.removeItem("rememberedUserId")
            }

            toast.success("Login berhasil! Mengalihkan...")

            setTimeout(() => {
                navigate("/dashboard")
            }, 1500)
        } catch (err: any) {
            setError(err.message || "Gagal masuk. Periksa User ID dan Password.")
            toast.error("Login gagal")
        } finally {
            setLoading(false)
        }
    }



    return (
        <div className="min-h-screen w-full flex font-sans bg-white">
            {/* Left Side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">

                {/* Background Slideshow */}
                {backgroundImages.map((img, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? "opacity-30" : "opacity-0"
                            }`}
                        style={{
                            backgroundImage: `url(${img})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            zIndex: 0
                        }}
                    />
                ))}

                {/* Overlay to ensure text readability */}
                <div className="absolute inset-0 bg-slate-900/80 z-1" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
                            <img
                                src={logoTanjungpinang}
                                alt="Logo"
                                className="w-8 h-8 object-contain"
                            />
                        </div>
                        <span className="text-xl font-semibold tracking-wide text-white/90">Dinas Kependudukan dan Pencatatan Sipil</span>
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
                    &copy; {new Date().getFullYear()} Copyright by Mahasiswa Magang UMRAH 2026
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
                                    name="username"
                                    autoComplete="username"
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
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    autoComplete="current-password"
                                    placeholder="Masukkan Password Anda"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                />
                                <label
                                    htmlFor="remember"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 cursor-pointer"
                                >
                                    Ingat Saya
                                </label>
                            </div>
                            <a href="#" className="text-xs font-medium text-amber-600 hover:text-amber-700 hover:underline">
                                Lupa Password?
                            </a>
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
                </div>
            </div>
        </div>
    )
}
