import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { Plus, Trash2, X } from "lucide-react"
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

interface AktaData {
    id: number
    nik: string | null
    nama_lengkap: string
    data_detail: {
        no_akta: string
        nama_anak: string
        nama_ayah: string
        nama_ibu: string
        tgl_lahir_anak: string
    }
    created_at: string
}

export function AktaForm() {
    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [dataList, setDataList] = useState<AktaData[]>([])
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        no_akta: "",
        nama_anak: "",
        nama_ayah: "",
        nama_ibu: "",
        tgl_lahir_anak: ""
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsFetching(true)
        const { data, error } = await supabase
            .from("residents")
            .select("*")
            .eq("jenis_dokumen", "AKTA")
            .order("created_at", { ascending: false })

        if (!error && data) {
            setDataList(data)
        }
        setIsFetching(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.from("residents").insert({
                nama_lengkap: formData.nama_anak,
                jenis_dokumen: "AKTA",
                data_detail: formData,
                nik: null
            })

            if (error) throw error
            toast.success("Data Akta Kelahiran berhasil disimpan")
            setFormData({ no_akta: "", nama_anak: "", nama_ayah: "", nama_ibu: "", tgl_lahir_anak: "" })
            setShowForm(false)
            fetchData()
        } catch (error: any) {
            toast.error("Gagal menyimpan: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const confirmDelete = async () => {
        if (!deleteId) return

        const { error } = await supabase.from("residents").delete().eq("id", deleteId)
        if (!error) {
            toast.success("Data berhasil dihapus")
            fetchData()
        } else {
            toast.error("Gagal menghapus: " + error.message)
        }
        setDeleteId(null)
    }

    const handleDelete = (id: number) => {
        setDeleteId(id)
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-"
        return new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
    }

    return (
        <div className="space-y-6">
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Yakin ingin menghapus data ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Data akan dihapus secara permanen dan tidak dapat dikembalikan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Data Akta Kelahiran</h2>
                    <p className="text-sm text-muted-foreground">Kelola data Akta Kelahiran</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                    {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {showForm ? "Batal" : "Tambah Data Akta"}
                </Button>
            </div>

            {/* Input Form */}
            {showForm && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>Input Akta Kelahiran Baru</CardTitle>
                        <CardDescription>
                            Masukkan data kelahiran untuk penerbitan Akta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="no_akta">Nomor Akta (jika ada)</Label>
                            <Input id="no_akta" value={formData.no_akta} onChange={handleChange} placeholder="Nomor Registrasi Akta" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nama_anak">Nama Anak</Label>
                            <Input id="nama_anak" value={formData.nama_anak} onChange={handleChange} placeholder="Nama Lengkap Anak" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nama_ayah">Nama Ayah</Label>
                                <Input id="nama_ayah" value={formData.nama_ayah} onChange={handleChange} placeholder="Nama Lengkap Ayah" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nama_ibu">Nama Ibu</Label>
                                <Input id="nama_ibu" value={formData.nama_ibu} onChange={handleChange} placeholder="Nama Lengkap Ibu" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tgl_lahir_anak">Tanggal Lahir Anak</Label>
                            <Input id="tgl_lahir_anak" type="date" value={formData.tgl_lahir_anak} onChange={handleChange} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSubmit} disabled={loading}>{loading ? "Menyimpan..." : "Simpan Data Akta"}</Button>
                    </CardFooter>
                </Card>
            )}

            {/* Data List */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Akta Kelahiran Tersimpan</CardTitle>
                    <CardDescription>Total: {dataList.length} data</CardDescription>
                </CardHeader>
                <CardContent>
                    {isFetching ? (
                        <div className="space-y-3">
                            <div className="h-12 w-full bg-muted rounded-md animate-pulse" />
                            <div className="h-12 w-full bg-muted rounded-md animate-pulse" />
                            <div className="h-12 w-full bg-muted rounded-md animate-pulse" />
                        </div>
                    ) : dataList.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Belum ada data Akta Kelahiran. Klik "Tambah Data Akta" untuk menambahkan.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-3 font-medium">No. Akta</th>
                                        <th className="text-left p-3 font-medium">Nama Anak</th>
                                        <th className="text-left p-3 font-medium">Orang Tua</th>
                                        <th className="text-left p-3 font-medium">Tgl Lahir</th>
                                        <th className="text-center p-3 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataList.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-3 font-mono text-xs">{item.data_detail?.no_akta || "-"}</td>
                                            <td className="p-3">{item.nama_lengkap}</td>
                                            <td className="p-3 text-muted-foreground text-xs">
                                                <div>Ayah: {item.data_detail?.nama_ayah || "-"}</div>
                                                <div>Ibu: {item.data_detail?.nama_ibu || "-"}</div>
                                            </td>
                                            <td className="p-3">{formatDate(item.data_detail?.tgl_lahir_anak)}</td>
                                            <td className="p-3 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
