import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCcw, Trash2, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { logActivity } from "@/lib/logger"
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

export default function RecycleBin() {
    const [activeTab, setActiveTab] = useState("penduduk")
    const [dataList, setDataList] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [restoreId, setRestoreId] = useState<number | null>(null)
    const [permanentDeleteId, setPermanentDeleteId] = useState<number | null>(null)

    const categories = [
        { id: "penduduk", label: "Penduduk (KTP)", table: "penduduk" },
        { id: "kartu_keluarga", label: "Kartu Keluarga", table: "kartu_keluarga" },
        { id: "akta_kelahiran", label: "Akta Kelahiran", table: "akta_kelahiran" },
        { id: "akta_kematian", label: "Akta Kematian", table: "akta_kematian" },
        { id: "akta_perkawinan", label: "Akta Perkawinan", table: "akta_perkawinan" },
        { id: "akta_perceraian", label: "Akta Perceraian", table: "akta_perceraian" },
    ]

    useEffect(() => {
        fetchDeletedData()
    }, [activeTab])

    const fetchDeletedData = async () => {
        setLoading(true)
        const currentCategory = categories.find(c => c.id === activeTab)
        if (!currentCategory) return

        const { data, error } = await supabase
            .from(currentCategory.table)
            .select("*")
            .eq("is_deleted", true)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Error fetching deleted data:", error)
        } else {
            setDataList(data || [])
        }
        setLoading(false)
    }

    const handleRestore = async () => {
        if (!restoreId) return
        const currentCategory = categories.find(c => c.id === activeTab)
        if (!currentCategory) return

        try {
            const { error } = await supabase
                .from(currentCategory.table)
                .update({ is_deleted: false })
                .eq("id", restoreId)

            if (error) throw error

            await logActivity("RESTORE DATA", `Mengembalikan data ${currentCategory.label} ID: ${restoreId}`)
            toast.success("Data berhasil dipulihkan!")
            fetchDeletedData()
        } catch (error: any) {
            toast.error("Gagal memulihkan: " + error.message)
        } finally {
            setRestoreId(null)
        }
    }

    const handlePermanentDelete = async () => {
        if (!permanentDeleteId) return
        const currentCategory = categories.find(c => c.id === activeTab)
        if (!currentCategory) return

        try {
            const { error } = await supabase
                .from(currentCategory.table)
                .delete()
                .eq("id", permanentDeleteId)

            if (error) throw error

            await logActivity("HAPUS PERMANEN", `Menghapus permanen data ${currentCategory.label} ID: ${permanentDeleteId}`)
            toast.success("Data dihapus permanen!")
            fetchDeletedData()
        } catch (error: any) {
            toast.error("Gagal menghapus permanen: " + error.message)
        } finally {
            setPermanentDeleteId(null)
        }
    }

    // Dynamic Display Helper
    const renderItemInfo = (item: any) => {
        switch (activeTab) {
            case "penduduk":
                return (
                    <div>
                        <div className="font-medium text-slate-800">{item.nama_lengkap}</div>
                        <div className="text-xs text-muted-foreground">NIK: {item.nik}</div>
                    </div>
                )
            case "kartu_keluarga":
                return (
                    <div>
                        <div className="font-medium text-slate-800">KK: {item.no_kk}</div>
                        <div className="text-xs text-muted-foreground">Kepala: {item.kepala_keluarga}</div>
                    </div>
                )
            case "akta_kelahiran":
                return (
                    <div>
                        <div className="font-medium text-slate-800">{item.nama_anak}</div>
                        <div className="text-xs text-muted-foreground">No. Akta: {item.no_akta}</div>
                    </div>
                )
            case "akta_kematian":
                return (
                    <div>
                        <div className="font-medium text-slate-800">{item.nama}</div>
                        <div className="text-xs text-muted-foreground">No. Surat: {item.no_surat}</div>
                    </div>
                )
            case "akta_perkawinan":
            case "akta_perceraian":
                return (
                    <div>
                        <div className="font-medium text-slate-800">{item.nama_suami} & {item.nama_istri}</div>
                        <div className="text-xs text-muted-foreground">No. Akta: {item.no_akta}</div>
                    </div>
                )
            default:
                return <div>Item ID: {item.id}</div>
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Trash2 className="h-6 w-6 text-red-500" />
                    Tempat Sampah (Recycle Bin)
                </h2>
                <p className="text-sm text-muted-foreground">
                    Kelola data yang telah dihapus. Data di sini dapat dipulihkan atau dihapus secara permanen.
                </p>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto">
                            {categories.map(cat => (
                                <TabsTrigger key={cat.id} value={cat.id} className="text-xs py-2 h-full whitespace-normal">
                                    {cat.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <p>Memuat data sampah...</p>
                        </div>
                    ) : dataList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                            <CheckCircle className="h-10 w-10 text-green-500 mb-2 opacity-20" />
                            <p className="font-medium">Tempat sampah kosong</p>
                            <p className="text-xs">Tidak ada data terhapus di kategori ini.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {dataList.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                            <Trash2 className="h-5 w-5" />
                                        </div>
                                        {renderItemInfo(item)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                            onClick={() => setRestoreId(item.id)}
                                        >
                                            <RefreshCcw className="h-4 w-4 mr-1" />
                                            Pulihkan
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => setPermanentDeleteId(item.id)}
                                        >
                                            Hapus Permanen
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Restore Dialog */}
            <AlertDialog open={!!restoreId} onOpenChange={() => setRestoreId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Pulihkan Data?</AlertDialogTitle>
                        <AlertDialogDescription>Data akan dikembalikan ke daftar aktif.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestore} className="bg-green-600 hover:bg-green-700">Ya, Pulihkan</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Permanent Delete Dialog */}
            <AlertDialog open={!!permanentDeleteId} onOpenChange={() => setPermanentDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">Hapus Permanen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini <span className="font-bold text-red-500">TIDAK DAPAT DIBATALKAN</span>. Data akan hilang selamanya dari database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePermanentDelete} className="bg-red-600 hover:bg-red-700">Ya, Hapus Permanen</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
