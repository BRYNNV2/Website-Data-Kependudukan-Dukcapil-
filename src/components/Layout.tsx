import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FileText, LogOut, Menu, X, ChevronDown, Users, CreditCard, Baby, Settings, ChevronsLeft, ChevronsRight, ScrollText, Heart, HeartCrack, BookX } from "lucide-react"
import logoDinas from "@/assets/logo.png"
import { supabase } from "@/lib/supabaseClient"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface LayoutProps {
    children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [inputDataOpen, setInputDataOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()

    const isActive = (path: string) => location.pathname === path
    const [userName, setUserName] = useState("Admin Petugas")
    const [userInitial, setUserInitial] = useState("A")

    useEffect(() => {
        getProfile()

        // Listen for auth changes (like profile updates)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                const name = session.user.user_metadata?.full_name || "Admin Petugas"
                setUserName(name)
                setUserInitial(name.charAt(0).toUpperCase())
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const getProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const name = user.user_metadata?.full_name || "Admin Petugas"
            setUserName(name)
            setUserInitial(name.charAt(0).toUpperCase())
        }
    }
    const isInputDataActive = () => location.pathname.startsWith("/input-data")

    // Auto-expand Input Data menu if we're on any input-data page
    useEffect(() => {
        if (isInputDataActive()) {
            setInputDataOpen(true)
        }
    }, [location.pathname])

    const handleLogoutClick = () => {
        setLogoutDialogOpen(true)
    }

    const confirmLogout = async () => {
        await supabase.auth.signOut()
        navigate("/")
    }

    const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
        <Link to={to} title={isCollapsed ? label : ""}>
            <div className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all",
                isCollapsed && "justify-center px-2",
                isActive(to)
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span>{label}</span>}
            </div>
        </Link>
    )

    const SubNavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
        <Link to={to}>
            <div className={cn(
                "flex items-center gap-3 pl-9 pr-3 py-2 rounded-md transition-all text-sm",
                isActive(to)
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
            </div>
        </Link>
    )

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Logout Alert */}
            <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin keluar dari aplikasi SI-PENDUDUK?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmLogout} className="bg-red-600 hover:bg-red-700 text-white">
                            Keluar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50 bg-white border-r transition-all duration-300 transform lg:transform-none flex flex-col",
                sidebarOpen ? "translate-x-0" : "-translate-x-full",
                isCollapsed ? "w-20" : "w-64"
            )}>
                {/* Sidebar Header */}
                <div className={cn("h-16 flex items-center border-b relative", isCollapsed ? "justify-center px-0" : "px-6")}>
                    <img src={logoDinas} alt="Logo" className={cn("h-8 w-8 object-contain transition-all", !isCollapsed && "mr-2")} />

                    <span className={cn(
                        "font-bold text-lg text-primary truncate transition-all duration-300",
                        isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                    )}>
                        SI-PENDUDUK
                    </span>

                    <button
                        className="ml-auto lg:hidden text-muted-foreground hover:text-primary"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {/* Desktop Toggle Button */}
                    <button
                        className="absolute -right-3 top-5 bg-white border shadow-md rounded-full p-1.5 text-muted-foreground hover:text-primary hidden lg:flex items-center justify-center z-50"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? <ChevronsRight className="h-3 w-3" /> : <ChevronsLeft className="h-3 w-3" />}
                    </button>
                </div>

                {/* Sidebar Nav */}
                <div className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
                    {!isCollapsed && <p className="px-2 text-xs font-semibold text-muted-foreground mb-2 mt-2 transition-all">MENU UTAMA</p>}
                    <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />

                    {/* Input Data - Expandable Menu */}
                    <div>
                        <button
                            onClick={() => {
                                if (isCollapsed) setIsCollapsed(false);
                                setInputDataOpen(!inputDataOpen)
                            }}
                            title={isCollapsed ? "Input Data" : ""}
                            className={cn(
                                "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md transition-all",
                                isCollapsed && "justify-center px-2",
                                isInputDataActive()
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                {!isCollapsed && <span>Input Data</span>}
                            </div>
                            {!isCollapsed && <ChevronDown className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                inputDataOpen ? "rotate-180" : ""
                            )} />}
                        </button>

                        {/* Sub-menu */}
                        <div className={cn(
                            "overflow-hidden transition-all duration-200",
                            inputDataOpen && !isCollapsed ? "max-h-[300px] mt-1" : "max-h-0"
                        )}>
                            <div className="space-y-1">
                                <SubNavItem to="/input-data/kartu-keluarga" icon={Users} label="Kartu Keluarga" />
                                <SubNavItem to="/input-data/ktp" icon={CreditCard} label="KTP Elektronik" />
                                <SubNavItem to="/input-data/akta-kelahiran" icon={Baby} label="Akta Kelahiran" />
                                <SubNavItem to="/input-data/akta-perkawinan" icon={Heart} label="Akta Perkawinan" />
                                <SubNavItem to="/input-data/akta-perceraian" icon={HeartCrack} label="Akta Perceraian" />
                                <SubNavItem to="/input-data/akta-kematian" icon={BookX} label="Akta Kematian" />
                            </div>
                        </div>
                    </div>

                    {!isCollapsed && <p className="px-2 text-xs font-semibold text-muted-foreground mb-2 mt-6 transition-all">LAINNYA</p>}
                    <NavItem to="/activity-log" icon={ScrollText} label="Log Aktivitas" />
                    <NavItem to="/settings" icon={Settings} label="Pengaturan" />
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-center">
                    <Button
                        variant="ghost"
                        className={cn("w-full text-red-600 hover:text-red-700 hover:bg-red-50", isCollapsed ? "justify-center px-0" : "justify-start")}
                        onClick={handleLogoutClick}
                        title={isCollapsed ? "Keluar" : ""}
                    >
                        <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                        {!isCollapsed && "Keluar"}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
                {/* Header */}
                <header className="h-16 bg-white border-b flex items-center px-4 lg:px-8 justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                        <h1 className="text-xl font-semibold text-gray-800 capitalize">
                            {location.pathname === "/dashboard" ? "Dashboard" :
                                location.pathname === "/input-data/kartu-keluarga" ? "Input Kartu Keluarga" :
                                    location.pathname === "/input-data/ktp" ? "Input KTP Elektronik" :
                                        location.pathname === "/input-data/akta-kelahiran" ? "Input Akta Kelahiran" :
                                            location.pathname === "/input-data/akta-perkawinan" ? "Input Akta Perkawinan" :
                                                location.pathname === "/input-data/akta-perceraian" ? "Input Akta Perceraian" :
                                                    location.pathname === "/input-data/akta-kematian" ? "Input Akta Kematian" :
                                                        location.pathname === "/settings" ? "Pengaturan Akun" :
                                                            "Admin Panel"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {userInitial}
                        </div>
                        <span className="text-sm font-medium mr-2 hidden sm:block">{userName}</span>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
