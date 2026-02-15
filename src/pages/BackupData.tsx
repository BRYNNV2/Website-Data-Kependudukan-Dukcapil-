import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Download, FileJson, Server, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"

export default function BackupData() {
    const [loading, setLoading] = useState<string | null>(null)

    const handleBackupJSON = async (tableName: string, label: string) => {
        try {
            setLoading(tableName)
            const { data, error } = await supabase.from(tableName).select('*')

            if (error) throw error
            if (!data || data.length === 0) {
                toast.error(`Tidak ada data ${label} untuk dibackup`)
                return
            }

            // Create JSON blob
            const jsonString = JSON.stringify(data, null, 2)
            const blob = new Blob([jsonString], { type: "application/json" })
            const url = URL.createObjectURL(blob)

            // Trigger download
            const a = document.createElement('a')
            a.href = url
            a.download = `backup_${tableName}_${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success(`Backup ${label} berhasil didownload!`)
        } catch (error: any) {
            toast.error(`Gagal backup: ${error.message}`)
        } finally {
            setLoading(null)
        }
    }

    const handleBackupAllJSON = async () => {
        try {
            setLoading("all")
            const tables = [
                { name: 'penduduk', label: 'Penduduk' },
                { name: 'kartu_keluarga', label: 'Kartu Keluarga' },
                { name: 'akta_kelahiran', label: 'Akta Kelahiran' },
                { name: 'akta_perkawinan', label: 'Akta Perkawinan' },
                { name: 'akta_perceraian', label: 'Akta Perceraian' },
                { name: 'akta_kematian', label: 'Akta Kematian' }
            ]

            const allData: Record<string, any[]> = {}

            for (const table of tables) {
                const { data } = await supabase.from(table.name).select('*')
                allData[table.name] = data || []
            }

            const jsonString = JSON.stringify(allData, null, 2)
            const blob = new Blob([jsonString], { type: "application/json" })
            const url = URL.createObjectURL(blob)

            const a = document.createElement('a')
            a.href = url
            a.download = `FULL_BACKUP_SIPENDUDUK_${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success("Full Backup System berhasil didownload!")
        } catch (error: any) {
            toast.error("Gagal melakukan full backup")
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-800">Backup & Restore Data</h3>
                <p className="text-muted-foreground">
                    Amankan data sistem dengan melakukan backup berkala dalam format JSON.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Full System Backup */}
                <Card className="md:col-span-2 border-blue-200 bg-blue-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700">
                            <Server className="h-6 w-6" />
                            Full System Backup
                        </CardTitle>
                        <CardDescription>
                            Download seluruh data dari semua tabel (Penduduk, KK, Akta) dalam satu file JSON master.
                            Sangat disarankan untuk dilakukan minimal seminggu sekali.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            size="lg"
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                            onClick={handleBackupAllJSON}
                            disabled={!!loading}
                        >
                            {loading === "all" ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sedang Memproses Backup...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="mr-2 h-5 w-5" />
                                    Download Full Backup (.json)
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Partial Backups */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-slate-600" />
                            Backup Per Tabel
                        </CardTitle>
                        <CardDescription>
                            Download data spesifik per kategori jika hanya membutuhkan sebagian data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {[
                            { id: 'penduduk', label: 'Data Penduduk (KTP)' },
                            { id: 'kartu_keluarga', label: 'Data Kartu Keluarga' },
                            { id: 'akta_kelahiran', label: 'Data Akta Kelahiran' },
                            { id: 'akta_perkawinan', label: 'Data Akta Perkawinan' },
                            { id: 'akta_perceraian', label: 'Data Akta Perceraian' },
                            { id: 'akta_kematian', label: 'Data Akta Kematian' },
                        ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <FileJson className="h-5 w-5 text-slate-400" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBackupJSON(item.id, item.label)}
                                    disabled={!!loading}
                                >
                                    {loading === item.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Information Card */}
                <Card className="border-orange-200 bg-orange-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                            <AlertTriangle className="h-5 w-5" />
                            Penting
                        </CardTitle>
                        <CardDescription className="text-orange-800/80">
                            File backup JSON berisi data sensitif kependudukan. Harap simpan file ini di tempat yang aman dan terenkripsi.
                            Jangan bagikan file backup kepada pihak yang tidak berwenang.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    )
}
