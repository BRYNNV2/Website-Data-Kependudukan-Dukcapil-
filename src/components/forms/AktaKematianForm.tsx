import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { Plus, Trash2, X, FileDown, Search, Eye, Upload, AlertTriangle, Loader2 } from "lucide-react"
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

interface AktaKematianData {
    id: number
    no_surat: string
    nama: string
    tanggal_meninggal: string
    tempat_lahir: string
    tanggal_lahir: string
    foto_dokumen?: string
    created_at: string
}


export function AktaKematianForm() {
    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [dataList, setDataList] = useState<AktaKematianData[]>([])
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [editId, setEditId] = useState<number | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        no_surat: "",
        nama: "",
        tanggal_meninggal: "",
        tempat_lahir: "",
        tanggal_lahir: ""
    })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [currentImage, setCurrentImage] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedYear, setSelectedYear] = useState<string>("all")
    const [viewItem, setViewItem] = useState<AktaKematianData | null>(null)

    const availableYears = useMemo(() => {
        const years = dataList.map(item => new Date(item.tanggal_meninggal).getFullYear().toString())
        return [...new Set(years)].sort((a, b) => b.localeCompare(a))
    }, [dataList])

    const filteredData = dataList.filter(item => {
        const matchesSearch = item.no_surat.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.nama.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesYear = selectedYear === "all" || new Date(item.tanggal_meninggal).getFullYear().toString() === selectedYear

        return matchesSearch && matchesYear
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsFetching(true)
        const { data, error } = await supabase
            .from("akta_kematian")
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
        if (!formData.no_surat || !formData.nama || !formData.tanggal_meninggal) {
            toast.error("Nama, No Surat, dan Tanggal Meninggal wajib diisi!")
            return
        }

        setLoading(true)
        try {
            let photoUrl = currentImage

            if (selectedFile) {
                const fileExt = selectedFile.name.split(".").pop()
                const fileName = `akta_kematian_${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from("population_docs")
                    .upload(fileName, selectedFile)

                if (uploadError) throw uploadError

                const { data: publicUrlData } = supabase.storage
                    .from("population_docs")
                    .getPublicUrl(fileName)

                photoUrl = publicUrlData.publicUrl
            }

            const payload = {
                no_surat: formData.no_surat,
                nama: formData.nama,
                tanggal_meninggal: formData.tanggal_meninggal,
                tempat_lahir: formData.tempat_lahir,
                tanggal_lahir: formData.tanggal_lahir,
                foto_dokumen: photoUrl
            }

            if (editId) {
                const { error } = await supabase.from("akta_kematian").update(payload).eq("id", editId)
                if (error) throw error
                await logActivity("UPDATE AKTA KEMATIAN", `Update No. ${formData.no_surat} - ${formData.nama}`)
                toast.success("Data berhasil diperbarui")
            } else {
                const { error } = await supabase.from("akta_kematian").insert(payload)
                if (error) throw error
                await logActivity("TAMBAH AKTA KEMATIAN", `Tambah No. ${formData.no_surat} - ${formData.nama}`)
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
        setFormData({ no_surat: "", nama: "", tanggal_meninggal: "", tempat_lahir: "", tanggal_lahir: "" })
        setSelectedFile(null)
        setCurrentImage(null)
        setShowForm(false)
        setEditId(null)
    }

    const handleEdit = (item: AktaKematianData) => {
        setFormData({
            no_surat: item.no_surat,
            nama: item.nama,
            tanggal_meninggal: item.tanggal_meninggal,
            tempat_lahir: item.tempat_lahir || "",
            tanggal_lahir: item.tanggal_lahir || ""
        })
        setCurrentImage(item.foto_dokumen || null)
        setEditId(item.id)
        setShowForm(true)
    }

    const confirmDelete = async () => {
        if (!deleteId) return
        const item = dataList.find(d => d.id === deleteId)

        const { error } = await supabase.from("akta_kematian").delete().eq("id", deleteId)
        if (!error) {
            if (item) await logActivity("HAPUS AKTA KEMATIAN", `Hapus No. ${item.no_surat}`)
            toast.success("Data berhasil dihapus")
            fetchData()
        } else {
            toast.error("Gagal menghapus: " + error.message)
        }
        setDeleteId(null)
    }

    const handleDownloadPDF = () => {
        const doc = new jsPDF()
        doc.text("Laporan Data Akta Kematian", 14, 15)
        doc.setFontSize(10)
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22)

        const tableData = dataList.map((item, index) => [
            index + 1,
            item.no_surat,
            item.nama,
            new Date(item.tanggal_meninggal).toLocaleDateString('id-ID'),
            `${item.tempat_lahir || '-'}, ${item.tanggal_lahir ? new Date(item.tanggal_lahir).toLocaleDateString('id-ID') : '-'}`
        ])

        autoTable(doc, {
            head: [['No', 'No. Surat', 'Nama', 'Waktu Meninggal', 'Lahir']],
            body: tableData,
            startY: 25,
            theme: 'grid',
            headStyles: { fillColor: [71, 85, 105], textColor: 255 },
            styles: { fontSize: 8 }
        })

        doc.save(`Laporan_Akta_Kematian_${new Date().getTime()}.pdf`)
    }

    return (
        <div className="space-y-6">
            {/* View Dialog */}
            <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Akta Kematian</DialogTitle>
                        <DialogDescription>Informasi detail surat akta kematian.</DialogDescription>
                    </DialogHeader>
                    {viewItem && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="font-semibold text-muted-foreground">No. Surat:</span>
                                    <span>{viewItem.no_surat}</span>
                                    <span className="font-semibold text-muted-foreground">Nama:</span>
                                    <span>{viewItem.nama}</span>
                                    <span className="font-semibold text-muted-foreground">Tgl Meninggal:</span>
                                    <span>{new Date(viewItem.tanggal_meninggal).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
                                    <span className="font-semibold text-muted-foreground">Tempat Lahir:</span>
                                    <span>{viewItem.tempat_lahir || "-"}</span>
                                    <span className="font-semibold text-muted-foreground">Tgl Lahir:</span>
                                    <span>{viewItem.tanggal_lahir ? new Date(viewItem.tanggal_lahir).toLocaleDateString('id-ID', { dateStyle: 'long' }) : "-"}</span>
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
                    <h2 className="text-2xl font-bold text-gray-800">Data Akta Kematian</h2>
                    <p className="text-sm text-muted-foreground">Kelola pencatatan kematian penduduk.</p>
                </div>
                <div className="flex gap-2">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[130px] bg-white">
                            <SelectValue placeholder="Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tahun</SelectItem>
                            {availableYears.map(year => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Cari..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <Button variant="outline" onClick={handleDownloadPDF} className="gap-2 text-slate-600 border-slate-200 bg-slate-50 hover:bg-slate-100">
                        <FileDown className="h-4 w-4" /> PDF
                    </Button>
                    <Button onClick={() => setShowForm(!showForm)} className="gap-2 bg-slate-800 hover:bg-slate-900">
                        {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {showForm ? "Batal" : "Tambah Data"}
                    </Button>
                </div>
            </div>

            {showForm && (
                <Card className="animate-in slide-in-from-top-4 border-slate-200">
                    <CardHeader>
                        <CardTitle>{editId ? "Edit Data Kematian" : "Input Data Kematian Baru"}</CardTitle>
                        <CardDescription>Masukkan data kematian dengan lengkap.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="no_surat">Nomor Surat</Label>
                                <Input id="no_surat" value={formData.no_surat} onChange={handleChange} placeholder="Contoh: 123/KM/2024" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nama">Nama Lengkap</Label>
                                <Input id="nama" value={formData.nama} onChange={handleChange} placeholder="Nama Almarhum/Almarhumah" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tanggal_meninggal">Tanggal Meninggal</Label>
                                <Input id="tanggal_meninggal" type="date" value={formData.tanggal_meninggal} onChange={handleChange} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tempat_lahir">Lahir di (Tempat)</Label>
                                <Input id="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} placeholder="Kota/Kab" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tanggal_lahir">Lahir pada tanggal</Label>
                                <Input id="tanggal_lahir" type="date" value={formData.tanggal_lahir} onChange={handleChange} />
                            </div>
                        </div>

                        <ImageUploadCapture
                            label="Foto Dokumen Akta (Opsional)"
                            currentImage={currentImage}
                            onImageCaptured={(file) => setSelectedFile(file)}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={resetForm}>Batal</Button>
                            <Button onClick={handleSubmit} disabled={loading} className="bg-slate-800 hover:bg-slate-900 text-white">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : "Simpan Data"}
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
                                    <th className="p-3 font-medium">No. Surat</th>
                                    <th className="p-3 font-medium">Nama</th>
                                    <th className="p-3 font-medium">Tgl Meninggal</th>
                                    <th className="p-3 font-medium">Lahir</th>
                                    <th className="p-3 font-medium text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isFetching ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                                                <p>Memuat data...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Belum ada data.</td></tr>
                                ) : (
                                    filteredData.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/50">
                                            <td className="p-3">{item.no_surat}</td>
                                            <td className="p-3 font-medium text-slate-800">{item.nama}</td>
                                            <td className="p-3">
                                                {new Date(item.tanggal_meninggal).toLocaleDateString("id-ID")}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {item.tempat_lahir}, {new Date(item.tanggal_lahir).toLocaleDateString("id-ID")}
                                            </td>
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
