import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { ScrollText, Clock, User, Activity } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

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

    useEffect(() => {
        fetchLogs()
    }, [])

    const fetchLogs = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50) // Limit to last 50 activities for performance

        if (error) {
            console.error(error)
        } else if (data) {
            setLogs(data)
        }
        setLoading(false)
    }

    const getActionColor = (action: string) => {
        if (action.includes("TAMBAH")) return "bg-green-100 text-green-700"
        if (action.includes("EDIT") || action.includes("UPDATE")) return "bg-blue-100 text-blue-700"
        if (action.includes("HAPUS")) return "bg-red-100 text-red-700"
        return "bg-gray-100 text-gray-700"
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-800">Log Aktivitas</h2>
                <p className="text-muted-foreground">Riwayat aktivitas pengguna dalam sistem.</p>
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
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 bg-muted rounded-md animate-pulse" />
                            ))}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Belum ada aktivitas tercatat.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors gap-4">
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
                </CardContent>
            </Card>
        </div>
    )
}
