import { useState, useEffect } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { toast } from "sonner"

export function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine)

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            toast.dismiss("offline-toast")

            // Beri sedikit jeda agar transisi lebih smooth, tapi tetap cepat
            setTimeout(() => {
                toast.success("Koneksi internet terhubung kembali", {
                    icon: <Wifi className="h-5 w-5 text-green-600" />,
                    id: "online-toast",
                    duration: 3000,
                    className: "bg-green-50 border-green-200",
                    classNames: {
                        title: "text-green-800 font-bold",
                        description: "text-green-700 font-medium"
                    }
                })
            }, 100)
        }

        const handleOffline = () => {
            setIsOnline(false)
            // Hapus toast online jika ada
            toast.dismiss("online-toast")

            // Custom content agar style tidak di-override oleh default theme
            toast.custom(() => (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 shadow-lg w-full max-w-sm pointer-events-auto">
                    <WifiOff className="h-6 w-6 text-red-600 flex-shrink-0" />
                    <div className="flex flex-col">
                        <h3 className="text-red-800 font-semibold text-sm leading-tight">
                            Koneksi internet terputus
                        </h3>
                        <p className="text-black font-medium text-sm leading-snug opacity-100 mt-0.5">
                            Beberapa fitur mungkin tidak berfungsi.
                        </p>
                    </div>
                </div>
            ), {
                id: "offline-toast",
                duration: Infinity,
            })
        }

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        // Polling backup: Cek koneksi manual setiap 2 detik
        const intervalId = setInterval(() => {
            if (navigator.onLine !== isOnline) {
                if (navigator.onLine) {
                    handleOnline()
                } else {
                    handleOffline()
                }
            }
        }, 2000)

        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
            clearInterval(intervalId)
        }
    }, [isOnline])

    if (isOnline) return null

    return (
        <div className="bg-red-500 text-white text-xs font-medium py-1 px-4 text-center flex items-center justify-center gap-2 animate-in slide-in-from-top fixed top-0 left-0 right-0 z-[100]">
            <WifiOff className="h-3 w-3" />
            <span>Koneksi Terputus - Mode Offline</span>
        </div>
    )
}
