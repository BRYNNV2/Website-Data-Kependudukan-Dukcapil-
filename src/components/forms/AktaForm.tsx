import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { Plus, Trash2, X, FileDown, Search, Eye } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
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
import { ImageUploadCapture } from "@/components/ImageUploadCapture"

interface AktaData {
    id: number
    no_akta: string
    nama_anak: string
    nama_ayah: string
    nama_ibu: string
    tgl_lahir_anak: string
    foto_dokumen?: string
    created_at: string
}

export function AktaForm() {
    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [dataList, setDataList] = useState<AktaData[]>([])
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [editId, setEditId] = useState<number | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        no_akta: "",
        nama_anak: "",
        nama_ayah: "",
        nama_ibu: "",
        tgl_lahir_anak: ""
    })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [currentImage, setCurrentImage] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [viewItem, setViewItem] = useState<AktaData | null>(null)

    const filteredData = dataList.filter(item =>
        (item.no_akta && item.no_akta.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.nama_anak.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_ayah.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_ibu.toLowerCase().includes(searchTerm.toLowerCase())
    )

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsFetching(true)
        const { data, error } = await supabase
            .from("akta_kelahiran")
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
        // Validation
        if (!formData.nama_anak || !formData.nama_ayah || !formData.nama_ibu || !formData.tgl_lahir_anak) {
            toast.error("Nama anak, orang tua, dan tanggal lahir harus diisi!")
            return
        }

        const selectedDate = new Date(formData.tgl_lahir_anak)
        const today = new Date()
        if (selectedDate > today) {
            toast.error("Tanggal lahir tidak boleh lebih dari hari ini!")
            return
        }

        setLoading(true)
        try {
            let photoUrl = currentImage

            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop()
                const fileName = `akta/${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('population_docs')
                    .upload(fileName, selectedFile)

                if (uploadError) {
                    throw new Error("Gagal upload foto: " + uploadError.message)
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('population_docs')
                    .getPublicUrl(fileName)

                photoUrl = publicUrl
            }

            if (editId) {
                // Update
                const { error } = await supabase.from("akta_kelahiran").update({
                    no_akta: formData.no_akta,
                    nama_anak: formData.nama_anak,
                    nama_ayah: formData.nama_ayah,
                    nama_ibu: formData.nama_ibu,
                    tgl_lahir_anak: formData.tgl_lahir_anak,
                    foto_dokumen: photoUrl
                }).eq("id", editId)

                if (error) throw error
                toast.success("Data Akta berhasil diperbarui")
            } else {
                // Insert
                const { error } = await supabase.from("akta_kelahiran").insert({
                    no_akta: formData.no_akta,
                    nama_anak: formData.nama_anak,
                    nama_ayah: formData.nama_ayah,
                    nama_ibu: formData.nama_ibu,
                    tgl_lahir_anak: formData.tgl_lahir_anak,
                    foto_dokumen: photoUrl
                })

                if (error) throw error
                toast.success("Data Akta Kelahiran berhasil disimpan")
            }

            resetForm()
            fetchData()
        } catch (error: any) {
            toast.error("Gagal menyimpan: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({ no_akta: "", nama_anak: "", nama_ayah: "", nama_ibu: "", tgl_lahir_anak: "" })
        setSelectedFile(null)
        setCurrentImage(null)
        setShowForm(false)
        setEditId(null)
    }

    const handleView = (item: AktaData) => {
        setViewItem(item)
    }

    const handleEdit = (item: AktaData) => {
        setFormData({
            no_akta: item.no_akta,
            nama_anak: item.nama_anak,
            nama_ayah: item.nama_ayah,
            nama_ibu: item.nama_ibu,
            tgl_lahir_anak: item.tgl_lahir_anak
        })
        setCurrentImage(item.foto_dokumen || null)
        setEditId(item.id)
        setShowForm(true)
    }

    const confirmDelete = async () => {
        if (!deleteId) return

        const { error } = await supabase.from("akta_kelahiran").delete().eq("id", deleteId)
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

    const handleDownloadPDF = () => {
        const doc = new jsPDF()

        doc.text("Laporan Data Akta Kelahiran", 14, 15)
        doc.setFontSize(10)
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22)

        const tableData = dataList.map((item, index) => [
            index + 1,
            item.no_akta || "-",
            item.nama_anak,
            item.nama_ayah,
            item.nama_ibu,
            new Date(item.tgl_lahir_anak).toLocaleDateString('id-ID')
        ])

        autoTable(doc, {
            head: [['No', 'No. Akta', 'Nama Anak', 'Nama Ayah', 'Nama Ibu', 'Tgl Lahir']],
            body: tableData,
            startY: 25,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 8 }
        })

        doc.save(`Laporan_Akta_${new Date().getTime()}.pdf`)
    }

    return (
        <div className="space-y-6">
            {/* View Detail Dialog */}
            <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Detail Akta Kelahiran</DialogTitle>
                        <DialogDescription>
                            Informasi lengkap data Akta Kelahiran
                        </DialogDescription>
                    </DialogHeader>
                    {viewItem && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <span className="font-semibold">No. Akta</span>
                                    <span className="col-span-2">: {viewItem.no_akta || "-"}</span>

                                    <span className="font-semibold">Nama Anak</span>
                                    <span className="col-span-2">: {viewItem.nama_anak}</span>

                                    <span className="font-semibold">Nama Ayah</span>
                                    <span className="col-span-2">: {viewItem.nama_ayah}</span>

                                    <span className="font-semibold">Nama Ibu</span>
                                    <span className="col-span-2">: {viewItem.nama_ibu}</span>

                                    <span className="font-semibold">Tgl Lahir Anak</span>
                                    <span className="col-span-2">: {formatDate(viewItem.tgl_lahir_anak)}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Buki Fisik / Foto</Label>
                                {viewItem.foto_dokumen ? (
                                    <div className="border rounded-md overflow-hidden aspect-video bg-muted flex items-center justify-center">
                                        <img
                                            src={viewItem.foto_dokumen}
                                            alt="Foto Fisik Akta"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="border rounded-md aspect-video bg-muted flex items-center justify-center text-muted-foreground text-sm">
                                        Tidak ada foto bukti.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

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

            {/* Header with Search and Add Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Data Akta Kelahiran</h2>
                    <p className="text-sm text-muted-foreground">Kelola data Akta Kelahiran</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari No. Akta / Nama..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
                        <FileDown className="h-4 w-4" />
                        Export PDF
                    </Button>
                    <Button onClick={() => {
                        if (showForm) {
                            resetForm()
                        } else {
                            setShowForm(true)
                        }
                    }} className="gap-2">
                        {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {showForm ? "Batal" : "Tambah Data Akta"}
                    </Button>
                </div>
            </div>

            {/* Input Form */}
            {showForm && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>{editId ? "Edit Akta Kelahiran" : "Input Akta Kelahiran Baru"}</CardTitle>
                        <CardDescription>
                            {editId ? "Perbarui data Akta Kelahiran." : "Masukkan data kelahiran untuk penerbitan Akta."}
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
                        <div className="space-y-2">
                            <ImageUploadCapture
                                label="Foto Dokumen Akta (Fisik)"
                                currentImage={currentImage}
                                onImageCaptured={(file) => setSelectedFile(file)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSubmit} disabled={loading}>{loading ? "Menyimpan..." : (editId ? "Simpan Perubahan" : "Simpan Data Akta")}</Button>
                    </CardFooter>
                </Card>
            )}

            {/* Data List */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Akta Kelahiran Tersimpan</CardTitle>
                    <CardDescription>Total: {dataList.length} data {searchTerm && `(Ditemukan: ${filteredData.length})`}</CardDescription>
                </CardHeader>
                <CardContent>
                    {isFetching ? (
                        <div className="space-y-3">
                            <div className="h-12 w-full bg-muted rounded-md animate-pulse" />
                            <div className="h-12 w-full bg-muted rounded-md animate-pulse" />
                            <div className="h-12 w-full bg-muted rounded-md animate-pulse" />
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchTerm ? "Tidak ada data yang cocok dengan pencarian." : "Belum ada data Akta Kelahiran. Klik 'Tambah Data Akta' untuk menambahkan."}
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
                                    {filteredData.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-3 font-mono text-xs">{item.no_akta || "-"}</td>
                                            <td className="p-3">{item.nama_anak}</td>
                                            <td className="p-3 text-muted-foreground text-xs">
                                                <div>Ayah: {item.nama_ayah || "-"}</div>
                                                <div>Ibu: {item.nama_ibu || "-"}</div>
                                            </td>
                                            <td className="p-3">{formatDate(item.tgl_lahir_anak)}</td>
                                            <td className="p-3 text-center flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                                    onClick={() => handleView(item)}
                                                    title="Lihat Detail"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => handleEdit(item)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                                </Button>
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
