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

interface KTPData {
    id: number
    nik: string
    nama_lengkap: string
    tempat_lahir: string
    tgl_lahir: string
    pekerjaan: string
    created_at: string
}

export function KTPForm() {
    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [dataList, setDataList] = useState<KTPData[]>([])
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        nik: "",
        nama: "",
        tempat_lahir: "",
        tgl_lahir: "",
        pekerjaan: ""
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsFetching(true)
        const { data, error } = await supabase
            .from("penduduk")
            .select("*")
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
            const { error } = await supabase.from("penduduk").insert({
                nik: formData.nik,
                nama_lengkap: formData.nama,
                tempat_lahir: formData.tempat_lahir,
                tgl_lahir: formData.tgl_lahir,
                pekerjaan: formData.pekerjaan
            })

            if (error) throw error
            toast.success("Data KTP berhasil disimpan")
            setFormData({ nik: "", nama: "", tempat_lahir: "", tgl_lahir: "", pekerjaan: "" })
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

        const { error } = await supabase.from("penduduk").delete().eq("id", deleteId)
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

            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Data KTP Elektronik</h2>
                    <p className="text-sm text-muted-foreground">Kelola data KTP Elektronik</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                    {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {showForm ? "Batal" : "Tambah Data KTP"}
                </Button>
            </div>

            {/* Input Form */}
            {showForm && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>Input KTP Elektronik Baru</CardTitle>
                        <CardDescription>
                            Masukkan data penduduk untuk pembuatan KTP baru.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nik">NIK</Label>
                            <Input id="nik" value={formData.nik} onChange={handleChange} placeholder="16 digit NIK" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nama">Nama Lengkap</Label>
                            <Input id="nama" value={formData.nama} onChange={handleChange} placeholder="Sesuai Akta Kelahiran" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
                                <Input id="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} placeholder="Kota Kelahiran" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tgl_lahir">Tanggal Lahir</Label>
                                <Input id="tgl_lahir" type="date" value={formData.tgl_lahir} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pekerjaan">Pekerjaan</Label>
                            <Input id="pekerjaan" value={formData.pekerjaan} onChange={handleChange} placeholder="Pekerjaan saat ini" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSubmit} disabled={loading}>{loading ? "Menyimpan..." : "Simpan Data KTP"}</Button>
                    </CardFooter>
                </Card>
            )
            }

            {/* Data List */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar KTP Tersimpan</CardTitle>
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
                            Belum ada data KTP. Klik "Tambah Data KTP" untuk menambahkan.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-3 font-medium">NIK</th>
                                        <th className="text-left p-3 font-medium">Nama Lengkap</th>
                                        <th className="text-left p-3 font-medium">TTL</th>
                                        <th className="text-left p-3 font-medium">Pekerjaan</th>
                                        <th className="text-center p-3 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataList.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-3 font-mono text-xs">{item.nik}</td>
                                            <td className="p-3">{item.nama_lengkap}</td>
                                            <td className="p-3 text-muted-foreground">
                                                {item.tempat_lahir || "-"}, {formatDate(item.tgl_lahir)}
                                            </td>
                                            <td className="p-3">{item.pekerjaan || "-"}</td>
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
        </div >
    )
}
