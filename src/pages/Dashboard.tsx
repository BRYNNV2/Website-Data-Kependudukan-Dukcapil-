import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CheckCircle } from "lucide-react"

export default function Dashboard() {
    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">
                    +20 dari bulan lalu
                </p>
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-gray-800">Dashboard</h2>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total Penduduk Terdata" value="12,345" icon={Users} color="text-blue-600" />
                <StatCard title="Input Hari Ini" value="45" icon={FileText} color="text-green-600" />
                <StatCard title="KK Terverifikasi" value="3,200" icon={CheckCircle} color="text-orange-600" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Input Terbaru</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div>
                                            <p className="font-medium">Penduduk Baru {i}</p>
                                            <p className="text-xs text-muted-foreground">NIK: 217123456789000{i}</p>
                                        </div>
                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">Baru Saja</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="col-span-3">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Statistik Wilayah</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-[200px] bg-muted/20 rounded-md m-4">
                            <span className="text-muted-foreground">Chart Area</span>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
