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

interface KKData {
    id: number
    no_kk: string
    kepala_keluarga: string
    alamat: string
    rt: string
    rw: string
    created_at: string
}

export function KKForm() {
    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [dataList, setDataList] = useState<KKData[]>([])
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        no_kk: "",
        kepala_keluarga: "",
        alamat: "",
        rt: "",
        rw: ""
    })

    // Fetch existing data on mount
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsFetching(true)
        const { data, error } = await supabase
            .from("kartu_keluarga")
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
            const { error } = await supabase.from("kartu_keluarga").insert({
                no_kk: formData.no_kk,
                kepala_keluarga: formData.kepala_keluarga,
                alamat: formData.alamat,
                rt: formData.rt,
                rw: formData.rw
            })

            if (error) throw error
            toast.success("Data Kartu Keluarga berhasil disimpan")
            setFormData({ no_kk: "", kepala_keluarga: "", alamat: "", rt: "", rw: "" })
            setShowForm(false)
            fetchData() // Refresh list
        } catch (error: any) {
            toast.error("Gagal menyimpan: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const confirmDelete = async () => {
        if (!deleteId) return

        const { error } = await supabase.from("kartu_keluarga").delete().eq("id", deleteId)
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
                    <h2 className="text-2xl font-bold text-gray-800">Data Kartu Keluarga</h2>
                    <p className="text-sm text-muted-foreground">Kelola data Kartu Keluarga</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                    {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {showForm ? "Batal" : "Tambah Data KK"}
                </Button>
            </div>

            {/* Input Form (collapsible) */}
            {showForm && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>Input Kartu Keluarga Baru</CardTitle>
                        <CardDescription>
                            Masukkan data Kartu Keluarga baru.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="no_kk">Nomor KK</Label>
                            <Input id="no_kk" value={formData.no_kk} onChange={handleChange} placeholder="16 digit Nomor KK" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="kepala_keluarga">Nama Kepala Keluarga</Label>
                            <Input id="kepala_keluarga" value={formData.kepala_keluarga} onChange={handleChange} placeholder="Nama Lengkap sesuai KTP" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="alamat">Alamat Lengkap</Label>
                            <Input id="alamat" value={formData.alamat} onChange={handleChange} placeholder="Jalan, RT/RW, Kelurahan, Kecamatan" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="rt">RT</Label>
                                <Input id="rt" value={formData.rt} onChange={handleChange} placeholder="001" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rw">RW</Label>
                                <Input id="rw" value={formData.rw} onChange={handleChange} placeholder="001" />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? "Menyimpan..." : "Simpan Data KK"}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Data List */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Kartu Keluarga Tersimpan</CardTitle>
                    <CardDescription>
                        Total: {dataList.length} data
                    </CardDescription>
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
                            Belum ada data Kartu Keluarga. Klik "Tambah Data KK" untuk menambahkan.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-3 font-medium">No. KK</th>
                                        <th className="text-left p-3 font-medium">Kepala Keluarga</th>
                                        <th className="text-left p-3 font-medium">Alamat</th>
                                        <th className="text-left p-3 font-medium">RT/RW</th>
                                        <th className="text-center p-3 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataList.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-3 font-mono text-xs">{item.no_kk}</td>
                                            <td className="p-3">{item.kepala_keluarga}</td>
                                            <td className="p-3 text-muted-foreground">{item.alamat || "-"}</td>
                                            <td className="p-3">{item.rt || "-"}/{item.rw || "-"}</td>
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
