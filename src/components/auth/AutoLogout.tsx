import { useEffect, useState, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { ShieldAlert, LogOut, Activity } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Configurations
const IDLE_TIMEOUT =  30 * 60 * 1000 // 30 Detik untuk testing
const WARNING_TIMEOUT = 10 * 1000; // Warning muncul 10 detik sebelum sesi berakhir

export function AutoLogout() {
    const navigate = useNavigate();

    const [warningOpen, setWarningOpen] = useState(false);
    const [remainingTime, setRemainingTime] = useState(WARNING_TIMEOUT / 1000);

    const isWarningOpenRef = useRef(false);
    const activityTimeoutRef = useRef<number | null>(null);
    const warningIntervalRef = useRef<number | null>(null);

    const handleLogout = useCallback(async () => {
        isWarningOpenRef.current = false;
        setWarningOpen(false);
        if (warningIntervalRef.current) window.clearInterval(warningIntervalRef.current);
        if (activityTimeoutRef.current) window.clearTimeout(activityTimeoutRef.current);

        await supabase.auth.signOut();
        localStorage.removeItem("login_timestamp");
        navigate("/?message=session_expired");
    }, [navigate]);

    const showWarning = useCallback(() => {
        isWarningOpenRef.current = true;
        setWarningOpen(true);
        setRemainingTime(WARNING_TIMEOUT / 1000);

        if (warningIntervalRef.current) window.clearInterval(warningIntervalRef.current);

        warningIntervalRef.current = window.setInterval(() => {
            setRemainingTime((prev) => {
                if (prev <= 1) {
                    window.clearInterval(warningIntervalRef.current!);
                    handleLogout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [handleLogout]);

    const resetTimer = useCallback(() => {
        if (isWarningOpenRef.current) return; // Jangan reset jika dialog peringatan sudah muncul

        if (activityTimeoutRef.current) window.clearTimeout(activityTimeoutRef.current);
        if (warningIntervalRef.current) window.clearInterval(warningIntervalRef.current);

        activityTimeoutRef.current = window.setTimeout(showWarning, IDLE_TIMEOUT - WARNING_TIMEOUT);
    }, [showWarning]);

    const handleStayLoggedIn = () => {
        isWarningOpenRef.current = false;
        setWarningOpen(false);
        if (warningIntervalRef.current) window.clearInterval(warningIntervalRef.current);
        resetTimer();
    };

    useEffect(() => {
        // Event listeners untuk mendeteksi aktivitas pengguna
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

        const eventOptions = { passive: true };
        events.forEach((event) => {
            window.addEventListener(event, resetTimer, eventOptions);
        });

        // Memulai timer saat komponen pertama kali dirender
        resetTimer();

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
            if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
            if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
        };
    }, [resetTimer]);

    return (
        <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
            <AlertDialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
                {/* Header Section */}
                <div className="bg-red-50 dark:bg-red-950/20 p-6 flex flex-col items-center justify-center text-center border-b border-red-100 dark:border-red-900/30">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 bg-red-200 dark:bg-red-800/40 rounded-full scale-150 animate-ping opacity-30"></div>
                        <div className="bg-red-100 dark:bg-red-900/60 p-4 rounded-full relative z-10 shadow-sm">
                            <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-500 relative z-20" />
                        </div>
                    </div>
                    
                    <AlertDialogTitle className="text-xl font-bold text-red-700 dark:text-red-400">
                        Peringatan Keamanan
                    </AlertDialogTitle>
                    <p className="text-sm font-medium text-red-600/80 dark:text-red-500/80 mt-1">
                        Sesi Anda Akan Segera Berakhir
                    </p>
                </div>

                {/* Body Section */}
                <div className="p-6">
                    <AlertDialogDescription className="text-center text-base text-gray-600 dark:text-gray-300 flex flex-col items-center">
                        <span className="mb-4">
                            Sistem mendeteksi tidak ada aktivitas di perangkat. Sesi Anda akan diakhiri secara otomatis dalam waktu:
                        </span>
                        
                        <div className="flex items-center justify-center px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 w-full mb-2">
                            <span className="text-5xl font-black text-red-600 dark:text-red-500 tabular-nums tracking-tighter drop-shadow-sm flex items-end">
                                {remainingTime} <span className="text-lg font-bold text-red-500/70 dark:text-red-400/70 ml-2 mb-1">detik</span>
                            </span>
                        </div>
                    </AlertDialogDescription>
                </div>

                {/* Footer Section */}
                <div className="p-6 pt-0 flex gap-3 flex-col sm:flex-row w-full mt-2 border-t-0">
                    <AlertDialogCancel 
                        onClick={handleLogout} 
                        className="flex-1 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 m-0 rounded-lg hidden sm:flex items-center justify-center gap-2 transition-colors h-11"
                    >
                        <LogOut className="w-4 h-4" /> Keluar Sekarang
                    </AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleStayLoggedIn} 
                        className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 hover:dark:bg-red-700 text-white shadow-md hover:shadow-lg transition-all m-0 rounded-lg flex items-center justify-center gap-2 h-11"
                    >
                        <Activity className="w-4 h-4" /> Tetap Masuk
                    </AlertDialogAction>
                    
                    {/* For mobile view order */}
                    <AlertDialogCancel 
                        onClick={handleLogout} 
                        className="flex-1 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 m-0 rounded-lg flex sm:hidden items-center justify-center gap-2 transition-colors h-11"
                    >
                        <LogOut className="w-4 h-4" /> Keluar Sekarang
                    </AlertDialogCancel>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
