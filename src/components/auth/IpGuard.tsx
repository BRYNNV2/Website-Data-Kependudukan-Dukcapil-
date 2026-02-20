import { useEffect, useState } from "react"
import { ThreeBodyLoader } from "@/components/ui/ThreeBodyLoader"
import { ShieldAlert, MapPin, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"

// CONFIGURATION FROM ENVIRONMENT VARIABLES
const IS_IP_RESTRICTION_ACTIVE = import.meta.env.VITE_IS_IP_RESTRICTION_ACTIVE === 'true';

// Parse allowed IPs from env string (comma-separated)
// Example in .env: VITE_ALLOWED_IPS=123.456.78.90,192.168.1.1
const ALLOWED_IPS: string[] = (import.meta.env.VITE_ALLOWED_IPS || "")
    .split(",")
    .map((ip: string) => ip.trim())
    .filter((ip: string) => ip.length > 0);

// Add Localhost explicitly for development if needed, or manage via env
if (import.meta.env.DEV) {
    ALLOWED_IPS.push("127.0.0.1", "::1");
}

console.log("IP Guard Config:", { active: IS_IP_RESTRICTION_ACTIVE, allowed: ALLOWED_IPS });

export function IpGuard({ children }: { children: React.ReactNode }) {
    const [isAllowed, setIsAllowed] = useState<boolean | null>(null)
    const [userIp, setUserIp] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!IS_IP_RESTRICTION_ACTIVE) {
            setIsAllowed(true)
            setLoading(false)
            return
        }

        const checkIP = async () => {
            try {
                // Gunakan layanan pihak ketiga gratis untuk cek IP Public pengunjung
                const response = await fetch('https://api.ipify.org?format=json')
                const data = await response.json()
                const currentIp = data.ip
                setUserIp(currentIp)

                // Cek apakah IP ada di daftar putih (Whitelist)
                const isWhitelisted = ALLOWED_IPS.includes(currentIp)

                // Tambahan: Logika untuk Development (Localhost biasanya tidak punya public IP di ipify)
                // Jadi kita anggap aman jika error atau logic lain, tapi untuk strict mode:
                setIsAllowed(isWhitelisted)
            } catch (err) {
                console.error("Gagal mengecek IP:", err)
                setError(true) // Gagal koneksi ke pengecek IP
                setIsAllowed(false) // Default ke tolak demi keamanan
            } finally {
                setLoading(false)
            }
        }

        checkIP()
    }, [])

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50 flex-col gap-4">
                <ThreeBodyLoader />
                <p className="text-sm text-muted-foreground animate-pulse">Memverifikasi Jaringan Kantor...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-xl text-center border-t-4 border-yellow-500">
                    <WifiOff className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Gagal Verifikasi Jaringan</h1>
                    <p className="text-gray-600 mb-6">
                        Sistem tidak dapat memverifikasi IP Address Anda karena gangguan koneksi.
                        Silakan refresh halaman atau periksa koneksi internet Anda.
                    </p>
                    <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
                </div>
            </div>
        )
    }

    if (!isAllowed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
                <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-2xl text-center border-t-8 border-red-600">
                    <div className="mb-6 flex justify-center">
                        <div className="p-4 bg-red-100 rounded-full">
                            <ShieldAlert className="w-20 h-20 text-red-600" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">AKSES DITOLAK</h1>
                    <h2 className="text-sm font-bold text-red-600 tracking-widest mb-6">403 FORBIDDEN - RESTRICTED AREA</h2>

                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6 text-left">
                        <p className="text-sm text-gray-700 mb-2 font-semibold flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Status Keamanan:
                        </p>
                        <p className="text-sm text-gray-600">
                            IP Address Anda <span className="font-mono bg-gray-200 px-1 rounded ml-1 text-black">{userIp}</span> tidak terdaftar dalam White-List Sistem Dinas Dukcapil.
                        </p>
                        <hr className="my-3" />
                        <p className="text-xs text-gray-500">
                            Sistem ini dilindungi oleh Geo-Fencing. Akses hanya diperbolehkan melalui Jaringan Internet Kantor Resmi.
                            Jika Anda adalah petugas, pastikan Anda terhubung ke Wi-Fi Kantor.
                        </p>
                    </div>

                    <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                        Cek Ulang Koneksi
                    </Button>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
