import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CheckCircle, Heart, HeartCrack, BookX, HardDrive, CreditCard, Archive } from "lucide-react"
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
    BarChart,
    Bar,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PopulationMap } from "@/components/PopulationMap"

interface CompletenessStat {
    category: string
    total: number
    completed: number
    percentage: number
    color: string
    bgColor: string
    icon: any
}

function CompletenessItem({ stat }: { stat: CompletenessStat }) {
    const [width, setWidth] = useState(0)

    useEffect(() => {
        const timer = setTimeout(() => {
            setWidth(stat.percentage)
        }, 100)
        return () => clearTimeout(timer)
    }, [stat.percentage])

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <stat.icon className={`h-4 w-4 ${stat.color.replace('bg-', 'text-')}`} />
                    <span className="font-medium text-slate-700">{stat.category}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stat.bgColor} ${stat.color.replace('bg-', 'text-')}`}>
                    {stat.percentage}%
                </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${stat.color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${width}%` }}
                />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stat.completed} file terupload</span>
                <span>Total: {stat.total}</span>
            </div>
        </div>
    )
}

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalPenduduk: 0,
        totalKK: 0,
        totalAkta: 0,
        totalAktaPerkawinan: 0,
        totalAktaPerceraian: 0,
        totalAktaKematian: 0
    })

    const [inputHistory, setInputHistory] = useState<any[]>([])
    const [completenessStats, setCompletenessStats] = useState<CompletenessStat[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedStatCategory, setSelectedStatCategory] = useState("akta_perceraian")
    const [annualStats, setAnnualStats] = useState<{ year: string, count: number }[]>([])
    const [rekapStats, setRekapStats] = useState<{ year: string, count: number }[]>([])


    // Color map for charts
    const categoryColors: Record<string, string> = {
        akta_perceraian: "#E91E63", // Pink/Purple
        akta_perkawinan: "#D81B60", // Pink
        akta_kelahiran: "#F59E0B", // Orange
        akta_kematian: "#475569", // Slate
        penduduk: "#2563EB", // Blue
        kartu_keluarga: "#16A34A" // Green
    }


    useEffect(() => {
        fetchDashboardData()
        fetchRekapStats()
    }, [])


    useEffect(() => {
        fetchAnnualStats()
    }, [selectedStatCategory])

    const fetchRekapStats = async () => {
        try {
            // Fetch all rekap_arsip data needed
            const { data } = await supabase.from('rekap_arsip').select('waktu, jumlah_berkas')

            if (data) {
                const yearCounts: Record<string, number> = {}

                data.forEach((item: any) => {
                    // Parse year from "waktu" string (e.g. "Januari 2024" or "2023")
                    // Match 4 digits starting with 19 or 20
                    const yearMatch = String(item.waktu).match(/(19|20)\d{2}/)
                    const year = yearMatch ? yearMatch[0] : 'Lainnya'
                    const count = item.jumlah_berkas || 0

                    yearCounts[year] = (yearCounts[year] || 0) + count
                })

                const sorted = Object.entries(yearCounts)
                    .map(([year, count]) => ({ year, count }))
                    .filter(x => x.year !== 'Lainnya') // Optional: hide invalid years
                    .sort((a, b) => a.year.localeCompare(b.year))

                // Add Lainnya at the end if exists and > 0
                if (yearCounts['Lainnya'] > 0) {
                    sorted.push({ year: 'Lainnya', count: yearCounts['Lainnya'] })
                }

                setRekapStats(sorted)
            }
        } catch (error) {
            console.error("Error fetching rekap stats:", error)
        }
    }

    const fetchAnnualStats = async () => {
        let tableName = selectedStatCategory
        let dateCol = 'created_at'

        switch (selectedStatCategory) {
            case 'akta_perceraian': dateCol = 'tanggal_terbit'; break;
            case 'akta_perkawinan': dateCol = 'tanggal_terbit'; break;
            case 'akta_kelahiran': dateCol = 'tanggal_lahir'; break;
            case 'akta_kematian': dateCol = 'tanggal_meninggal'; break;
            case 'penduduk': dateCol = 'created_at'; break;
            case 'kartu_keluarga': dateCol = 'tanggal_dikeluarkan'; break;
            default: dateCol = 'created_at';
        }

        try {
            const { data } = await supabase.from(tableName).select(dateCol)

            if (data) {
                const yearCounts: Record<string, number> = {}
                data.forEach((item: any) => {
                    const dateVal = item[dateCol]
                    if (dateVal) {
                        const year = new Date(dateVal).getFullYear().toString()
                        yearCounts[year] = (yearCounts[year] || 0) + 1
                    }
                })

                // Fill range if needed, or just sort
                const sorted = Object.entries(yearCounts)
                    .map(([year, count]) => ({ year, count }))
                    .sort((a, b) => a.year.localeCompare(b.year))

                setAnnualStats(sorted)
            }
        } catch (error) {
            console.error("Error fetching annual stats:", error)
        }
    }

    async function fetchDashboardData() {
        setLoading(true)
        try {
            const today = new Date()
            const sevenDaysAgo = subDays(startOfDay(today), 6).toISOString()
            const endToday = endOfDay(today).toISOString()

            // Define all promises
            // 1. Totals
            const pTotalPenduduk = supabase.from("penduduk").select("*", { count: 'exact', head: true })
            const pTotalKK = supabase.from("kartu_keluarga").select("*", { count: 'exact', head: true })
            const pTotalAkta = supabase.from("akta_kelahiran").select("*", { count: 'exact', head: true })
            const pTotalAktaPerkawinan = supabase.from("akta_perkawinan").select("*", { count: 'exact', head: true })
            const pTotalAktaPerceraian = supabase.from("akta_perceraian").select("*", { count: 'exact', head: true })
            const pTotalAktaKematian = supabase.from("akta_kematian").select("*", { count: 'exact', head: true })

            // 2. Completed Counts (Not Null)
            // Note: verified column names, standard is foto_dokumen
            const pCompletedKK = supabase.from("kartu_keluarga").select("*", { count: 'exact', head: true }).not('foto_dokumen', 'is', null)
            const pCompletedAkta = supabase.from("akta_kelahiran").select("*", { count: 'exact', head: true }).not('foto_dokumen', 'is', null)
            const pCompletedAktaPerkawinan = supabase.from("akta_perkawinan").select("*", { count: 'exact', head: true }).not('foto_dokumen', 'is', null)
            const pCompletedAktaPerceraian = supabase.from("akta_perceraian").select("*", { count: 'exact', head: true }).not('foto_dokumen', 'is', null)
            const pCompletedAktaKematian = supabase.from("akta_kematian").select("*", { count: 'exact', head: true }).not('foto_dokumen', 'is', null)


            // 3. History (Get created_at for last 7 days)
            // Selecting only created_at is minimal.
            const pHistoryPenduduk = supabase.from("penduduk").select("created_at").gte('created_at', sevenDaysAgo).lte('created_at', endToday)
            const pHistoryKK = supabase.from("kartu_keluarga").select("created_at").gte('created_at', sevenDaysAgo).lte('created_at', endToday)
            const pHistoryAkta = supabase.from("akta_kelahiran").select("created_at").gte('created_at', sevenDaysAgo).lte('created_at', endToday)
            const pHistoryAktaPerkawinanRaw = supabase.from("akta_perkawinan").select("created_at").gte('created_at', sevenDaysAgo).lte('created_at', endToday)
            const pHistoryAktaPerceraian = supabase.from("akta_perceraian").select("created_at").gte('created_at', sevenDaysAgo).lte('created_at', endToday)
            const pHistoryAktaKematian = supabase.from("akta_kematian").select("created_at").gte('created_at', sevenDaysAgo).lte('created_at', endToday)


            // EXECUTE ALL IN PARALLEL
            const [
                resTotalPenduduk, resTotalKK, resTotalAkta, resTotalAktaPerkawinan, resTotalAktaPerceraian, resTotalAktaKematian,
                resCompletedPenduduk, resCompletedKK, resCompletedAkta, resCompletedAktaPerkawinan, resCompletedAktaPerceraian, resCompletedAktaKematian,
                resHistPenduduk, resHistKK, resHistAkta, resHistAktaPerkawinan, resHistAktaPerceraian, resHistAktaKematian
            ] = await Promise.all([
                pTotalPenduduk, pTotalKK, pTotalAkta, pTotalAktaPerkawinan, pTotalAktaPerceraian, pTotalAktaKematian,
                // For Penduduk completion
                supabase.from("penduduk").select("*", { count: 'exact', head: true }).not('foto_dokumen', 'is', null),
                pCompletedKK, pCompletedAkta, pCompletedAktaPerkawinan, pCompletedAktaPerceraian, pCompletedAktaKematian,
                pHistoryPenduduk, pHistoryKK, pHistoryAkta, pHistoryAktaPerkawinanRaw, pHistoryAktaPerceraian, pHistoryAktaKematian
            ])

            // SET STATS
            const totalPenduduk = resTotalPenduduk.count || 0
            const totalKK = resTotalKK.count || 0
            const totalAkta = resTotalAkta.count || 0
            const totalAktaPerkawinan = resTotalAktaPerkawinan.count || 0
            const totalAktaPerceraian = resTotalAktaPerceraian.count || 0
            const totalAktaKematian = resTotalAktaKematian.count || 0

            setStats({
                totalPenduduk,
                totalKK,
                totalAkta,
                totalAktaPerkawinan,
                totalAktaPerceraian,
                totalAktaKematian
            })

            // PROCESS HISTORY
            const historyMap: Record<string, number> = {}
            // init last 7 days with 0
            for (let i = 0; i < 7; i++) {
                const dayStr = format(subDays(today, i), "d MMM", { locale: id })
                historyMap[dayStr] = 0
            }

            const addToHistory = (data: any[] | null) => {
                data?.forEach(item => {
                    // Item could be { created_at: ... }
                    const dateVal = item.created_at
                    if (dateVal) {
                        const dayStr = format(new Date(dateVal), "d MMM", { locale: id })
                        if (historyMap.hasOwnProperty(dayStr)) {
                            historyMap[dayStr]++
                        }
                    }
                })
            }

            addToHistory(resHistPenduduk.data)
            addToHistory(resHistKK.data)
            addToHistory(resHistAkta.data)
            addToHistory(resHistAktaPerkawinan.data)
            addToHistory(resHistAktaPerceraian.data)
            addToHistory(resHistAktaKematian.data)

            // Convert map to array
            const historyArr = []
            for (let i = 6; i >= 0; i--) {
                const dayStr = format(subDays(today, i), "d MMM", { locale: id })
                historyArr.push({
                    date: dayStr,
                    count: historyMap[dayStr] || 0
                })
            }
            setInputHistory(historyArr)

            // PROCESS COMPLETENESS
            // config reusing totals
            const completenessData = [
                { label: 'KTP Elektronik', total: totalPenduduk, completed: resCompletedPenduduk.count || 0, color: 'bg-blue-600', bg: 'bg-blue-100', icon: CreditCard },
                { label: 'Kartu Keluarga', total: totalKK, completed: resCompletedKK.count || 0, color: 'bg-green-600', bg: 'bg-green-100', icon: FileText },
                { label: 'Akta Kelahiran', total: totalAkta, completed: resCompletedAkta.count || 0, color: 'bg-orange-600', bg: 'bg-orange-100', icon: CheckCircle },
                { label: 'Akta Perkawinan', total: totalAktaPerkawinan, completed: resCompletedAktaPerkawinan.count || 0, color: 'bg-pink-600', bg: 'bg-pink-100', icon: Heart },
                { label: 'Akta Perceraian', total: totalAktaPerceraian, completed: resCompletedAktaPerceraian.count || 0, color: 'bg-purple-600', bg: 'bg-purple-100', icon: HeartCrack },
                { label: 'Akta Kematian', total: totalAktaKematian, completed: resCompletedAktaKematian.count || 0, color: 'bg-slate-600', bg: 'bg-slate-100', icon: BookX },
            ]

            const completenessStatsFormatted = completenessData.map(item => ({
                category: item.label,
                total: item.total,
                completed: item.completed,
                percentage: item.total ? Math.round((item.completed / item.total) * 100) : 0,
                color: item.color,
                bgColor: item.bg,
                icon: item.icon
            }))

            setCompletenessStats(completenessStatsFormatted)

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
                <StatCard
                    title="Total Akta Perkawinan"
                    value={stats.totalAktaPerkawinan}
                    icon={Heart}
                    color="text-pink-600"
                    subtitle="Data Perkawinan"
                />
                <StatCard
                    title="Total Akta Perceraian"
                    value={stats.totalAktaPerceraian}
                    icon={HeartCrack}
                    color="text-purple-600"
                    subtitle="Data Perceraian"
                />
                <StatCard
                    title="Total Akta Kematian"
                    value={stats.totalAktaKematian}
                    icon={BookX}
                    color="text-slate-600"
                    subtitle="Data Kematian"
                />
            </div>

            {/* Storage Insight - Status Kelengkapan Berkas */}
            <Card className="border-slate-200 shadow-sm col-span-full">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                        <HardDrive className="h-5 w-5 text-indigo-600" />
                        Status Kelengkapan Berkas Digital (Storage Insight)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {loading ? (
                            <div className="col-span-full text-center py-4 text-muted-foreground">Memuat data kelengkapan...</div>
                        ) : (
                            completenessStats.map((stat, index) => (
                                <CompletenessItem key={index} stat={stat} />
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Annual Statistics & Rekap Arsip Section */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5 col-span-full">

                {/* Statistik Data Input (Kependudukan) */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>Statistik Data Tahunan</CardTitle>
                        <div className="w-[180px]">
                            <Select value={selectedStatCategory} onValueChange={setSelectedStatCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="akta_perceraian">Akta Perceraian</SelectItem>
                                    <SelectItem value="akta_perkawinan">Akta Perkawinan</SelectItem>
                                    <SelectItem value="akta_kematian">Akta Kematian</SelectItem>
                                    <SelectItem value="akta_kelahiran">Akta Kelahiran</SelectItem>
                                    <SelectItem value="kartu_keluarga">Kartu Keluarga</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            {annualStats.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={annualStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            name="Jumlah Data"
                                            fill={categoryColors[selectedStatCategory] || "#8884d8"}
                                            radius={[4, 4, 0, 0]}
                                            barSize={40}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground flex-col gap-2">
                                    <BookX className="h-8 w-8 opacity-20" />
                                    <p>Belum ada data statistik.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Statistik Rekap Arsip Fisik */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-2 border-indigo-100 bg-indigo-50/30">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <Archive className="h-5 w-5 text-indigo-600" />
                            <CardTitle className="text-indigo-900">Arsip Fisik (Rekap)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            {rekapStats.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={rekapStats} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E7FF" />
                                        <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#4F46E5' }} axisLine={false} tickLine={false} />
                                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                                        <Tooltip
                                            cursor={{ fill: '#E0E7FF' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            name="Total Arsip"
                                            fill="#4F46E5"
                                            radius={[4, 4, 0, 0]}
                                            barSize={30}
                                        >
                                            {/* Gradient or distinct color */}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-indigo-400 flex-col gap-2">
                                    <Archive className="h-8 w-8 opacity-30" />
                                    <p className="text-sm">Belum ada data arsip.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
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
                                            { name: 'Akta Kelahiran', value: stats.totalAkta },
                                            { name: 'Akta Perkawinan', value: stats.totalAktaPerkawinan },
                                            { name: 'Akta Perceraian', value: stats.totalAktaPerceraian },
                                            { name: 'Akta Kematian', value: stats.totalAktaKematian },
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
                                            { name: 'Akta Kelahiran', value: stats.totalAkta },
                                            { name: 'Akta Perkawinan', value: stats.totalAktaPerkawinan },
                                            { name: 'Akta Perceraian', value: stats.totalAktaPerceraian },
                                            { name: 'Akta Kematian', value: stats.totalAktaKematian },
                                        ].map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={['#2563EB', '#16A34A', '#EA580C', '#E91E63', '#9C27B0', '#475569'][index % 6]} />
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

            <div>
                <PopulationMap />
            </div>
        </div>
    )
}
