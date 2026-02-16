import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { ScrollText, Clock, User, Activity, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { ThreeBodyLoader } from "@/components/ui/ThreeBodyLoader"

interface LogItem {
    id: number
    user_name: string
    action: string
    details: string
    created_at: string
}

export default function ActivityLog() {
    const [logs, setLogs] = useState<LogItem[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const pageSize = 10

    // Auto-pruning logs older than 7 days on mount
    // Auto-pruning logs older than 7 days on mount
    useEffect(() => {
        const pruneLogs = async () => {
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

            try {
                const { error, count } = await supabase
                    .from('activity_logs')
                    .delete({ count: 'exact' })
                    .lt('created_at', sevenDaysAgo.toISOString())

                if (error) {
                    console.error("Failed to auto-prune logs:", error.message)
                } else if (count && count > 0) {
                    console.log(`Auto-pruned ${count} old logs.`)
                }
            } catch (err) {
                console.error("Unexpected error pruning logs:", err)
            }
        }
        pruneLogs()
    }, [])

    useEffect(() => {
        fetchLogs()
    }, [page])

    const fetchLogs = async () => {
        setLoading(true)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data, error, count } = await supabase
            .from('activity_logs')
            .select('*', { count: 'exact' })
            .gte('created_at', sevenDaysAgo.toISOString()) // Filter only last 7 days
            .order('created_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) {
            console.error("Error fetching logs:", error)
        } else if (data) {
            setLogs(data)
            if (count) setTotalPages(Math.ceil(count / pageSize))
        }
        setLoading(false)
    }

    const getActionColor = (action: string) => {
        if (action.includes("TAMBAH")) return "bg-green-100 text-green-700"
        if (action.includes("EDIT") || action.includes("UPDATE")) return "bg-blue-100 text-blue-700"
        if (action.includes("HAPUS")) return "bg-red-100 text-red-700"
        return "bg-gray-100 text-gray-700"
    }

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = []
        // If total pages is small, show all
        if (totalPages <= 7) {
            for (let i = 0; i < totalPages; i++) pages.push(i)
        } else {
            // Logic to show: First, Last, and Current neighborhood
            // Simplified: Show standard sliding window for now to match request "1, 2, 3, 4, 5" style
            if (page < 4) {
                // Show 1, 2, 3, 4, 5 ... Last
                for (let i = 0; i < 5; i++) pages.push(i)
                pages.push(-1) // Separator
                pages.push(totalPages - 1)
            } else if (page > totalPages - 5) {
                // Show First ... n-4, n-3, n-2, n-1, n
                pages.push(0)
                pages.push(-1)
                for (let i = totalPages - 5; i < totalPages; i++) pages.push(i)
            } else {
                // Show First ... q-1, q, q+1 ... Last
                pages.push(0)
                pages.push(-1)
                for (let i = page - 1; i <= page + 1; i++) pages.push(i)
                pages.push(-1)
                pages.push(totalPages - 1)
            }
        }
        return pages
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-800">Log Aktivitas</h2>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <p>Riwayat aktivitas pengguna dalam sistem.</p>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
                        Auto-delete 7 hari
                    </span>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ScrollText className="h-5 w-5 text-primary" />
                        <CardTitle>Riwayat Aktivitas</CardTitle>
                    </div>
                    <CardDescription>Mencatat setiap perubahan data yang terjadi.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <ThreeBodyLoader size={45} color="#6366f1" />
                            <p className="text-sm font-medium text-indigo-600/80 animate-pulse">Memuat riwayat aktivitas...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-3">
                            <Clock className="h-10 w-10 text-gray-300" />
                            <p>Belum ada aktivitas tercatat.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors gap-4 group">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-full mt-1 ${getActionColor(log.action)}`}>
                                            <Activity className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(log.created_at), "d MMMM yyyy, HH:mm", { locale: id })}
                                                </span>
                                            </div>
                                            <p className="font-medium text-gray-900">{log.details}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0 bg-secondary/50 px-3 py-1.5 rounded-full">
                                        <User className="h-4 w-4" />
                                        <span>{log.user_name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t gap-4">
                        <div className="text-sm text-muted-foreground order-2 sm:order-1">
                            Menampilkan halaman {page + 1} dari {totalPages}
                        </div>

                        <div className="flex items-center gap-1 order-1 sm:order-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0 || loading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {getPageNumbers().map((pageNum, idx) => (
                                pageNum === -1 ? (
                                    <span key={`sep-${idx}`} className="mx-1 text-muted-foreground">...</span>
                                ) : (
                                    <Button
                                        key={pageNum}
                                        variant={page === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setPage(pageNum)}
                                        className={`w-8 h-8 p-0 ${page === pageNum ? 'pointer-events-none' : ''}`}
                                    >
                                        {pageNum + 1}
                                    </Button>
                                )
                            ))}

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= totalPages - 1 || loading}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
