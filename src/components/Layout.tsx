import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FileText, LogOut, Menu, X, ChevronDown, Users, CreditCard, Baby } from "lucide-react"
import logoDinas from "@/assets/logo.png"

interface LayoutProps {
    children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [inputDataOpen, setInputDataOpen] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()

    const isActive = (path: string) => location.pathname === path
    const isInputDataActive = () => location.pathname.startsWith("/input-data")

    // Auto-expand Input Data menu if we're on any input-data page
    useEffect(() => {
        if (isInputDataActive()) {
            setInputDataOpen(true)
        }
    }, [location.pathname])

    const handleLogout = () => {
        // Add supabase logout here later
        navigate("/")
    }

    const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
        <Link to={to}>
            <div className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all",
                isActive(to)
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
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
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r transition-transform duration-200 transform lg:transform-none flex flex-col",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Sidebar Header */}
                <div className="h-16 flex items-center px-6 border-b">
                    <img src={logoDinas} alt="Logo" className="h-8 w-8 mr-2 object-contain" />
                    <span className="font-bold text-lg text-primary truncate">SI-PENDUDUK</span>
                    <button
                        className="ml-auto lg:hidden text-muted-foreground hover:text-primary"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Sidebar Nav */}
                <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <p className="px-2 text-xs font-semibold text-muted-foreground mb-2 mt-2">MENU UTAMA</p>
                    <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />

                    {/* Input Data - Expandable Menu */}
                    <div>
                        <button
                            onClick={() => setInputDataOpen(!inputDataOpen)}
                            className={cn(
                                "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md transition-all",
                                isInputDataActive()
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4" />
                                <span>Input Data</span>
                            </div>
                            <ChevronDown className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                inputDataOpen ? "rotate-180" : ""
                            )} />
                        </button>

                        {/* Sub-menu */}
                        <div className={cn(
                            "overflow-hidden transition-all duration-200",
                            inputDataOpen ? "max-h-48 mt-1" : "max-h-0"
                        )}>
                            <div className="space-y-1">
                                <SubNavItem to="/input-data/kartu-keluarga" icon={Users} label="Kartu Keluarga" />
                                <SubNavItem to="/input-data/ktp" icon={CreditCard} label="KTP Elektronik" />
                                <SubNavItem to="/input-data/akta-kelahiran" icon={Baby} label="Akta Kelahiran" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t bg-gray-50">
                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Keluar
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
                                            "Admin Panel"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            A
                        </div>
                        <span className="text-sm font-medium mr-2 hidden sm:block">Admin Petugas</span>
                    </div>
                </header>

                {/* Page Content */}
                <div
                    className="flex-1 p-4 lg:p-8 overflow-y-auto"
                >
                    {children}
                </div>
            </main>
        </div>
    )
}
