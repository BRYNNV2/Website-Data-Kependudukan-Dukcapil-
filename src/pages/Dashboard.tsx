import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CheckCircle, Activity } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { id } from "date-fns/locale"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts"

import { PopulationMap } from "@/components/PopulationMap"

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalPenduduk: 0,
        totalKK: 0,
        totalAkta: 0
    })
    const [recentActivity, setRecentActivity] = useState<any[]>([])
    const [inputHistory, setInputHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            // Fetch Counts
            const { count: countPenduduk } = await supabase.from("penduduk").select("*", { count: 'exact', head: true })
            const { count: countKK } = await supabase.from("kartu_keluarga").select("*", { count: 'exact', head: true })
            const { count: countAkta } = await supabase.from("akta_kelahiran").select("*", { count: 'exact', head: true })

            setStats({
                totalPenduduk: countPenduduk || 0,
                totalKK: countKK || 0,
                totalAkta: countAkta || 0
            })

            // Fetch Input History (Last 7 Days)
            const today = new Date()
            const historyData = []

            for (let i = 6; i >= 0; i--) {
                const date = subDays(today, i)
                const start = startOfDay(date).toISOString()
                const end = endOfDay(date).toISOString()

                // Fetch counts for each day from all tables (approximate input activity)
                // Note: Fetching simple counts for performance. 
                // In a huge app, you'd have an analytics table.
                const { count: pCount } = await supabase.from("penduduk").select("*", { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end)
                const { count: kCount } = await supabase.from("kartu_keluarga").select("*", { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end)
                const { count: aCount } = await supabase.from("akta_kelahiran").select("*", { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end)

                historyData.push({
                    date: format(date, "d MMM", { locale: id }),
                    count: (pCount || 0) + (kCount || 0) + (aCount || 0)
                })
            }
            setInputHistory(historyData)


            // Fetch Recent Activity
            const { data: recentPenduduk } = await supabase
                .from("penduduk")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(5)

            if (recentPenduduk) {
                setRecentActivity(recentPenduduk)
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error)
        } finally {
            setLoading(false)
        }
    }

    const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : value}</div>
                <p className="text-xs text-muted-foreground">
                    {subtitle || "Total Data Terkini"}
                </p>
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-gray-800">Dashboard</h2>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Total Penduduk"
                    value={stats.totalPenduduk}
                    icon={Users}
                    color="text-blue-600"
                    subtitle="Data KTP/Penduduk"
                />
                <StatCard
                    title="Total Kartu Keluarga"
                    value={stats.totalKK}
                    icon={FileText}
                    color="text-green-600"
                    subtitle="Kepala Keluarga Terdata"
                />
                <StatCard
                    title="Total Akta Kelahiran"
                    value={stats.totalAkta}
                    icon={CheckCircle}
                    color="text-orange-600"
                    subtitle="Data Kelahiran"
                />
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Line Chart - Input Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tren Input Data (7 Hari Terakhir)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={inputHistory}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#2563EB"
                                        strokeWidth={3}
                                        dot={{ fill: '#2563EB', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Donut Chart - Percentage */}
                <Card>
                    <CardHeader>
                        <CardTitle>Overview Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Penduduk', value: stats.totalPenduduk },
                                            { name: 'Kartu Keluarga', value: stats.totalKK },
                                            { name: 'Akta', value: stats.totalAkta },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {[
                                            { name: 'Penduduk', value: stats.totalPenduduk },
                                            { name: 'Kartu Keluarga', value: stats.totalKK },
                                            { name: 'Akta', value: stats.totalAkta },
                                        ].map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={['#2563EB', '#16A34A', '#EA580C'][index % 3]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-500" />
                                Aktivitas Input Terbaru (Penduduk)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="text-center py-4 text-muted-foreground">Memuat data...</div>
                                ) : recentActivity.length === 0 ? (
                                    <div className="text-center py-4 text-muted-foreground">Belum ada aktivitas.</div>
                                ) : (
                                    recentActivity.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors rounded-lg border border-border/50">
                                            <div className="flex flex-col gap-1">
                                                <p className="font-medium text-sm">{item.nama_lengkap}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="font-mono bg-slate-100 px-1 rounded">{item.nik}</span>
                                                    <span>&bull;</span>
                                                    <span>{format(new Date(item.created_at), "d MMM yyyy, HH:mm", { locale: id })}</span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                                                Baru
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="col-span-3">
                    <PopulationMap />
                </div>
            </div>
        </div>
    )
}
