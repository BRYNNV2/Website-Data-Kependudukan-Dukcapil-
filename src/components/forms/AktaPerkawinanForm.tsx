import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { Plus, Trash2, X, FileDown, Search, Eye, Upload, AlertTriangle } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { logActivity } from "@/lib/logger"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ImageUploadCapture } from "@/components/ImageUploadCapture"

interface AktaPerkawinanData {
    id: number
    no_akta: string
    nama_suami: string
    nama_istri: string
    tanggal_terbit: string
    agama: string
    foto_dokumen?: string
    created_at: string
}

export function AktaPerkawinanForm() {
    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [dataList, setDataList] = useState<AktaPerkawinanData[]>([])
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [editId, setEditId] = useState<number | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        no_akta: "",
        nama_suami: "",
        nama_istri: "",
        tanggal_terbit: "",
        agama: ""
    })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [currentImage, setCurrentImage] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [viewItem, setViewItem] = useState<AktaPerkawinanData | null>(null)

    const filteredData = dataList.filter(item =>
        item.no_akta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_suami.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_istri.toLowerCase().includes(searchTerm.toLowerCase())
    )

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsFetching(true)
        const { data, error } = await supabase
            .from("akta_perkawinan")
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
        if (!formData.no_akta || !formData.nama_suami || !formData.nama_istri || !formData.tanggal_terbit || !formData.agama) {
            toast.error("Semua field harus diisi!")
            return
        }

        setLoading(true)
        try {
            let photoUrl = currentImage

            if (selectedFile) {
                const fileExt = selectedFile.name.split(".").pop()
                const fileName = `akta_perkawinan_${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from("population_docs")
                    .upload(fileName, selectedFile)

                if (uploadError) throw uploadError

                const { data: publicUrlData } = supabase.storage
                    .from("population_docs")
                    .getPublicUrl(fileName)

                photoUrl = publicUrlData.publicUrl
            }

            if (editId) {
                const { error } = await supabase.from("akta_perkawinan").update({
                    no_akta: formData.no_akta,
                    nama_suami: formData.nama_suami,
                    nama_istri: formData.nama_istri,
                    tanggal_terbit: formData.tanggal_terbit,
                    agama: formData.agama,
                    foto_dokumen: photoUrl
                }).eq("id", editId)

                if (error) throw error
                await logActivity("UPDATE AKTA PERKAWINAN", `Update No. ${formData.no_akta} (${formData.nama_suami} & ${formData.nama_istri})`)
                toast.success("Data berhasil diperbarui")
            } else {
                const { error } = await supabase.from("akta_perkawinan").insert({
                    no_akta: formData.no_akta,
                    nama_suami: formData.nama_suami,
                    nama_istri: formData.nama_istri,
                    tanggal_terbit: formData.tanggal_terbit,
                    agama: formData.agama,
                    foto_dokumen: photoUrl
                })

                if (error) throw error
                await logActivity("TAMBAH AKTA PERKAWINAN", `Tambah No. ${formData.no_akta} (${formData.nama_suami} & ${formData.nama_istri})`)
                toast.success("Data berhasil disimpan")
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
        setFormData({ no_akta: "", nama_suami: "", nama_istri: "", tanggal_terbit: "", agama: "" })
        setSelectedFile(null)
        setCurrentImage(null)
        setShowForm(false)
        setEditId(null)
    }

    const handleEdit = (item: AktaPerkawinanData) => {
        setFormData({
            no_akta: item.no_akta,
            nama_suami: item.nama_suami,
            nama_istri: item.nama_istri,
            tanggal_terbit: item.tanggal_terbit,
            agama: item.agama
        })
        setCurrentImage(item.foto_dokumen || null)
        setEditId(item.id)
        setShowForm(true)
    }

    const confirmDelete = async () => {
        if (!deleteId) return
        const item = dataList.find(d => d.id === deleteId)

        const { error } = await supabase.from("akta_perkawinan").delete().eq("id", deleteId)
        if (!error) {
            if (item) await logActivity("HAPUS AKTA PERKAWINAN", `Hapus No. ${item.no_akta}`)
            toast.success("Data berhasil dihapus")
            fetchData()
        } else {
            toast.error("Gagal menghapus: " + error.message)
        }
        setDeleteId(null)
    }

    const handleDownloadPDF = () => {
        const doc = new jsPDF()
        doc.text("Laporan Data Akta Perkawinan", 14, 15)
        doc.setFontSize(10)
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22)

        const tableData = dataList.map((item, index) => [
            index + 1,
            item.no_akta,
            item.nama_suami,
            item.nama_istri,
            item.agama,
            new Date(item.tanggal_terbit).toLocaleDateString('id-ID')
        ])

        autoTable(doc, {
            head: [['No', 'No. Akta', 'Suami', 'Istri', 'Agama', 'Tgl Terbit']],
            body: tableData,
            startY: 25,
            theme: 'grid',
            headStyles: { fillColor: [233, 30, 99], textColor: 255 }, // Pinkish for wedding
            styles: { fontSize: 8 }
        })

        doc.save(`Laporan_Akta_Perkawinan_${new Date().getTime()}.pdf`)
    }

    return (
        <div className="space-y-6">
            {/* View Dialog */}
            <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Akta Perkawinan</DialogTitle>
                        <DialogDescription>Informasi detail surat akta perkawinan.</DialogDescription>
                    </DialogHeader>
                    {viewItem && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="font-semibold text-muted-foreground">No. Akta:</span>
                                    <span>{viewItem.no_akta}</span>
                                    <span className="font-semibold text-muted-foreground">Nama Suami:</span>
                                    <span>{viewItem.nama_suami}</span>
                                    <span className="font-semibold text-muted-foreground">Nama Istri:</span>
                                    <span>{viewItem.nama_istri}</span>
                                    <span className="font-semibold text-muted-foreground">Agama:</span>
                                    <span>{viewItem.agama}</span>
                                    <span className="font-semibold text-muted-foreground">Tgl Terbit:</span>
                                    <span>{new Date(viewItem.tanggal_terbit).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
                                </div>
                            </div>
                            <div>
                                <Label>Dokumen Fisik</Label>
                                {viewItem.foto_dokumen ? (
                                    <div className="border rounded-md overflow-hidden aspect-video bg-muted flex items-center justify-center mt-2">
                                        <img src={viewItem.foto_dokumen} alt="Dokumen" className="w-full h-full object-contain" />
                                    </div>
                                ) : (
                                    <div className="border rounded-md aspect-video bg-muted flex items-center justify-center text-muted-foreground text-sm mt-2">
                                        Tidak ada foto.
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
                        <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
                        <AlertDialogDescription>Data akan dihapus permanen.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-2">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Peringatan!</AlertTitle>
                            <AlertDescription>
                                Tindakan ini bersifat permanen.
                            </AlertDescription>
                        </Alert>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Data Akta Perkawinan</h2>
                    <p className="text-sm text-muted-foreground">Kelola pencatatan perkawinan penduduk.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Cari..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <Button variant="outline" onClick={handleDownloadPDF} className="gap-2 text-pink-600 border-pink-200 bg-pink-50 hover:bg-pink-100">
                        <FileDown className="h-4 w-4" /> PDF
                    </Button>
                    <Button onClick={() => setShowForm(!showForm)} className="gap-2 bg-pink-600 hover:bg-pink-700">
                        {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {showForm ? "Batal" : "Tambah Data"}
                    </Button>
                </div>
            </div>

            {showForm && (
                <Card className="animate-in slide-in-from-top-4 border-pink-200">
                    <CardHeader>
                        <CardTitle>{editId ? "Edit Data Perkawanin" : "Input Data Perkawinan Baru"}</CardTitle>
                        <CardDescription>Masukkan data perkawinan dengan lengkap.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="no_akta">No. Surat Akta Perkawinan</Label>
                                <Input id="no_akta" value={formData.no_akta} onChange={handleChange} placeholder="Contoh: 123/PK/2024" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="agama">Agama</Label>
                                <Select
                                    value={formData.agama}
                                    onValueChange={(value) => setFormData({ ...formData, agama: value })}
                                >
                                    <SelectTrigger id="agama">
                                        <SelectValue placeholder="Pilih Agama" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Islam">Islam</SelectItem>
                                        <SelectItem value="Kristen">Kristen</SelectItem>
                                        <SelectItem value="Katolik">Katolik</SelectItem>
                                        <SelectItem value="Hindu">Hindu</SelectItem>
                                        <SelectItem value="Buddha">Buddha</SelectItem>
                                        <SelectItem value="Konghucu">Konghucu</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nama_suami">Nama Suami</Label>
                                <Input id="nama_suami" value={formData.nama_suami} onChange={handleChange} placeholder="Nama Lengkap Suami" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nama_istri">Nama Istri</Label>
                                <Input id="nama_istri" value={formData.nama_istri} onChange={handleChange} placeholder="Nama Lengkap Istri" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tanggal_terbit">Tanggal Diterbitkan</Label>
                                <Input id="tanggal_terbit" type="date" value={formData.tanggal_terbit} onChange={handleChange} />
                            </div>
                        </div>

                        <ImageUploadCapture
                            label="Foto Dokumen Akta (Opsional)"
                            currentImage={currentImage}
                            onImageCaptured={(file) => setSelectedFile(file)}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={resetForm}>Batal</Button>
                            <Button onClick={handleSubmit} disabled={loading} className="bg-pink-600 hover:bg-pink-700">
                                {loading ? "Menyimpan..." : "Simpan Data"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted api-head">
                                <tr className="border-b text-left">
                                    <th className="p-3 font-medium">No. Akta</th>
                                    <th className="p-3 font-medium">Suami & Istri</th>
                                    <th className="p-3 font-medium">Agama</th>
                                    <th className="p-3 font-medium">Tgl Terbit</th>
                                    <th className="p-3 font-medium text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isFetching ? (
                                    <tr><td colSpan={5} className="p-4 text-center">Memuat data...</td></tr>
                                ) : filteredData.length === 0 ? (
                                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Belum ada data.</td></tr>
                                ) : (
                                    filteredData.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/50">
                                            <td className="p-3">{item.no_akta}</td>
                                            <td className="p-3">
                                                <div className="font-medium text-pink-700">{item.nama_suami}</div>
                                                <div className="text-pink-600">& {item.nama_istri}</div>
                                            </td>
                                            <td className="p-3">{item.agama}</td>
                                            <td className="p-3">{new Date(item.tanggal_terbit).toLocaleDateString("id-ID")}</td>
                                            <td className="p-3 text-center space-x-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => setViewItem(item)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                                    <Upload className="h-4 w-4 rotate-90" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteId(item.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
