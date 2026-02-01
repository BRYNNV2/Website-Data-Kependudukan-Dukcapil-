import { ThreeBodyLoader } from "@/components/ui/ThreeBodyLoader"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { ExcelActions } from "@/components/ExcelActions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { Plus, Trash2, X, FileDown, Search, Eye, Upload, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { logActivity } from "@/lib/logger"
import { compressImage } from "@/lib/imageCompression"
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

interface AktaPerceraianData {
    id: number
    no_akta: string
    nama_suami: string
    nama_istri: string
    tanggal_terbit: string
    foto_dokumen?: string
    keterangan?: string
    deret?: string
    created_at: string
}

export function AktaPerceraianForm() {
    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [dataList, setDataList] = useState<AktaPerceraianData[]>([])
    const [currentPage, setCurrentPage] = useState(0)
    const pageSize = 10
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [editId, setEditId] = useState<number | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        no_akta: "",
        nama_suami: "",
        nama_istri: "",
        tanggal_terbit: "",
        keterangan: "",
        deret: ""
    })
    const [suggestions, setSuggestions] = useState({
        keterangan: [] as string[],
        deret: [] as string[]
    })
    const [totalItems, setTotalItems] = useState(0)

    // Dropdown options state
    const [allYears, setAllYears] = useState<string[]>([])
    const [allDeret, setAllDeret] = useState<string[]>([])
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [currentImage, setCurrentImage] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedYear, setSelectedYear] = useState<string>("all")
    const [selectedDeret, setSelectedDeret] = useState<string>("all")
    const [viewItem, setViewItem] = useState<AktaPerceraianData | null>(null)

    // Initial Load - Metadata & First Page
    useEffect(() => {
        fetchMetaData()
    }, [])

    // Fetch filters metadata (Years & Deret) - Run once
    const fetchMetaData = async () => {
        const { data } = await supabase
            .from("akta_perceraian")
            .select("tanggal_terbit, deret")
            .eq("is_deleted", false)

        if (data) {
            const years = data.map(item => new Date(item.tanggal_terbit).getFullYear().toString())
            const uniqueYears = [...new Set(years)].sort((a, b) => b.localeCompare(a))
            setAllYears(uniqueYears)

            const uniqueDerets = [...new Set(data.map(item => item.deret).filter(Boolean))].sort()
            setAllDeret(uniqueDerets as string[])
        }
    }

    // Server-side pagination calculation
    const totalPages = Math.ceil(totalItems / pageSize)

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(0)
    }, [searchTerm, selectedYear, selectedDeret])

    // Debounced Fetch
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchData()
        }, 500)
        return () => clearTimeout(delayDebounceFn)
    }, [currentPage, searchTerm, selectedYear, selectedDeret])

    const getPageNumbers = () => {
        const pages = []
        if (totalPages <= 7) {
            for (let i = 0; i < totalPages; i++) pages.push(i)
        } else {
            if (currentPage < 4) {
                for (let i = 0; i < 5; i++) pages.push(i)
                pages.push(-1)
                pages.push(totalPages - 1)
            } else if (currentPage > totalPages - 5) {
                pages.push(0)
                pages.push(-1)
                for (let i = totalPages - 5; i < totalPages; i++) pages.push(i)
            } else {
                pages.push(0)
                pages.push(-1)
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
                pages.push(-1)
                pages.push(totalPages - 1)
            }
        }
        return pages
    }

    const fetchData = async () => {
        setIsFetching(true)
        const from = currentPage * pageSize
        const to = from + pageSize - 1

        let query = supabase
            .from("akta_perceraian")
            .select("*", { count: "exact" })
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })
            .range(from, to)

        if (searchTerm) {
            query = query.or(`no_akta.ilike.%${searchTerm}%,nama_suami.ilike.%${searchTerm}%,nama_istri.ilike.%${searchTerm}%,keterangan.ilike.%${searchTerm}%`)
        }

        if (selectedYear !== "all") {
            const startDate = `${selectedYear}-01-01`
            const endDate = `${selectedYear}-12-31`
            query = query.gte("tanggal_terbit", startDate).lte("tanggal_terbit", endDate)
        }

        if (selectedDeret !== "all") {
            query = query.eq("deret", selectedDeret)
        }

        const { data, count, error } = await query

        if (!error && data) {
            setDataList(data)
            setTotalItems(count || 0)

            // Extract unique values for suggestions (optional)
            const uniqueKet = [...new Set(data.map(item => item.keterangan).filter(Boolean))] as string[]
            const uniqueDeret = [...new Set(data.map(item => item.deret).filter(Boolean))] as string[]
            setSuggestions({ keterangan: uniqueKet, deret: uniqueDeret })
        }
        setIsFetching(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleSubmit = async () => {
        if (!formData.no_akta || !formData.nama_suami || !formData.nama_istri || !formData.tanggal_terbit) {
            toast.error("Semua field utama harus diisi!")
            return
        }

        setLoading(true)
        try {
            let photoUrl = currentImage

            if (selectedFile) {
                const compressedFile = await compressImage(selectedFile) // Compress here
                const fileExt = compressedFile.name.split(".").pop()
                const fileName = `akta_perceraian_${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from("population_docs")
                    .upload(fileName, compressedFile)

                if (uploadError) throw uploadError

                const { data: publicUrlData } = supabase.storage
                    .from("population_docs")
                    .getPublicUrl(fileName)

                photoUrl = publicUrlData.publicUrl
            }

            if (editId) {
                const { error } = await supabase.from("akta_perceraian").update({
                    no_akta: formData.no_akta,
                    nama_suami: formData.nama_suami,
                    nama_istri: formData.nama_istri,
                    tanggal_terbit: formData.tanggal_terbit,
                    keterangan: formData.keterangan,
                    deret: formData.deret,
                    foto_dokumen: photoUrl
                }).eq("id", editId)

                if (error) throw error
                await logActivity("UPDATE AKTA PERCERAIAN", `Update No. ${formData.no_akta} (${formData.nama_suami} & ${formData.nama_istri})`)
                toast.success("Data berhasil diperbarui")
                window.dispatchEvent(new Event('trigger-notification-refresh'))
            } else {
                const { error } = await supabase.from("akta_perceraian").insert({
                    no_akta: formData.no_akta,
                    nama_suami: formData.nama_suami,
                    nama_istri: formData.nama_istri,
                    tanggal_terbit: formData.tanggal_terbit,
                    keterangan: formData.keterangan,
                    deret: formData.deret,
                    foto_dokumen: photoUrl
                })

                if (error) throw error
                await logActivity("TAMBAH AKTA PERCERAIAN", `Tambah No. ${formData.no_akta} (${formData.nama_suami} & ${formData.nama_istri})`)
                toast.success("Data berhasil disimpan")
                window.dispatchEvent(new Event('trigger-notification-refresh'))
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
        setFormData({ no_akta: "", nama_suami: "", nama_istri: "", tanggal_terbit: "", keterangan: "", deret: "" })
        setSelectedFile(null)
        setCurrentImage(null)
        setShowForm(false)
        setEditId(null)
    }

    const handleEdit = (item: AktaPerceraianData) => {
        setFormData({
            no_akta: item.no_akta,
            nama_suami: item.nama_suami,
            nama_istri: item.nama_istri,
            tanggal_terbit: item.tanggal_terbit,
            keterangan: item.keterangan || "",
            deret: item.deret || ""
        })
        setCurrentImage(item.foto_dokumen || null)
        setEditId(item.id)
        setShowForm(true)
    }

    const confirmDelete = async () => {
        if (!deleteId) return
        const item = dataList.find(d => d.id === deleteId)

        const { error } = await supabase.from("akta_perceraian").update({ is_deleted: true }).eq("id", deleteId)
        if (!error) {
            if (item) await logActivity("HAPUS AKTA PERCERAIAN", `Memindahkan No. ${item.no_akta} ke Sampah`)
            toast.success("Data dipindahkan ke Sampah")
            fetchData()
        } else {
            toast.error("Gagal menghapus: " + error.message)
        }
        setDeleteId(null)
    }

    const handleImport = async (importedData: any[]) => {
        setLoading(true)
        try {
            const validData = importedData.map(item => ({
                no_akta: String(item['No. Akta'] || item['no_akta'] || item['No Akta'] || ''),
                nama_suami: item['Nama Suami'] || item['nama_suami'] || '',
                nama_istri: item['Nama Istri'] || item['nama_istri'] || '',
                tanggal_terbit: item['Tanggal Terbit'] || item['tanggal_terbit'] || null,
                keterangan: item['Keterangan'] || item['keterangan'] || '',
                deret: item['Deret'] || item['deret'] || ''
            })).filter(item => item.nama_suami && item.nama_istri)

            if (validData.length === 0) {
                toast.error("Data valid tidak ditemukan")
                setLoading(false)
                return
            }

            const { error } = await supabase.from('akta_perceraian').upsert(validData, { onConflict: 'no_akta' })
            if (error) throw error

            await logActivity("IMPORT DATA PERCERAIAN", `Import ${validData.length} data`)
            toast.success(`Import berhasil: ${validData.length} data`)
            fetchData()
        } catch (err: any) {
            toast.error("Import gagal: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadPDF = () => {
        const doc = new jsPDF()
        doc.text("Laporan Data Akta Perceraian", 14, 15)
        doc.setFontSize(10)
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22)

        const tableData = dataList.map((item, index) => [
            index + 1,
            item.no_akta,
            item.nama_suami,
            item.nama_istri,
            new Date(item.tanggal_terbit).toLocaleDateString('id-ID'),
            item.keterangan || '-',
            item.deret || '-'
        ])

        autoTable(doc, {
            head: [['No', 'No. Akta', 'Suami', 'Istri', 'Tgl Terbit', 'Keterangan', 'Deret']],
            body: tableData,
            startY: 25,
            theme: 'grid',
            headStyles: { fillColor: [156, 39, 176], textColor: 255 }, // Purple for divorce?
            styles: { fontSize: 8 }
        })

        doc.save(`Laporan_Akta_Perceraian_${new Date().getTime()}.pdf`)
    }

    return (
        <div className="space-y-6">
            {/* View Dialog */}
            <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Akta Perceraian</DialogTitle>
                        <DialogDescription>Informasi detail surat akta perceraian.</DialogDescription>
                    </DialogHeader>
                    {viewItem && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="font-semibold text-muted-foreground">No. Akta:</span>
                                    <span>{viewItem.no_akta}</span>
                                    <span className="font-semibold text-muted-foreground">Keterangan:</span>
                                    <span>{viewItem.keterangan || "-"}</span>
                                    <span className="font-semibold text-muted-foreground">Deret:</span>
                                    <span>{viewItem.deret || "-"}</span>
                                    <span className="font-semibold text-muted-foreground">Nama Suami:</span>
                                    <span>{viewItem.nama_suami}</span>
                                    <span className="font-semibold text-muted-foreground">Nama Istri:</span>
                                    <span>{viewItem.nama_istri}</span>
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

            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Data Akta Perceraian</h2>
                    <p className="text-sm text-muted-foreground">Kelola pencatatan perceraian penduduk.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto items-center">
                    {/* Filters */}
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-full sm:w-32 bg-white">
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tahun</SelectItem>
                                {allYears.map(year => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedDeret} onValueChange={setSelectedDeret}>
                            <SelectTrigger className="w-full sm:w-32 bg-white">
                                <SelectValue placeholder="Deret" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Deret</SelectItem>
                                {allDeret.map(d => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:w-48 lg:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari..."
                            className="pl-8 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <ExcelActions data={dataList} fileName="Data_Akta_Perceraian" onImport={handleImport} isLoading={loading} />
                        <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 hover:border-red-300" title="Export Laporan PDF">
                            <FileDown className="h-4 w-4 mr-2" />
                            Export PDF
                        </Button>
                    </div>

                    <Button onClick={() => {
                        if (showForm) {
                            resetForm()
                        } else {
                            setShowForm(true)
                        }
                    }} className="gap-2 bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                        {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {showForm ? "Batal" : "Tambah"}
                    </Button>
                </div>
            </div>

            {showForm && (
                <Card className="animate-in slide-in-from-top-4 border-purple-200">
                    <CardHeader>
                        <CardTitle>{editId ? "Edit Data Perceraian" : "Input Data Perceraian Baru"}</CardTitle>
                        <CardDescription>Masukkan data perceraian dengan lengkap.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="no_akta">No. Surat Akta Perceraian</Label>
                                <Input id="no_akta" value={formData.no_akta} onChange={handleChange} placeholder="Contoh: 01/AC/TPI/2013" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="keterangan">Keterangan (Buku)</Label>
                                    <Input
                                        id="keterangan"
                                        list="ket-list"
                                        value={formData.keterangan}
                                        onChange={handleChange}
                                        placeholder="Contoh: BOOK AP 44"
                                    />
                                    <datalist id="ket-list">
                                        {suggestions.keterangan.map((item, i) => <option key={i} value={item} />)}
                                    </datalist>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="deret">Deret</Label>
                                    <Input
                                        id="deret"
                                        list="deret-list"
                                        value={formData.deret}
                                        onChange={handleChange}
                                        placeholder="Contoh: 4"
                                    />
                                    <datalist id="deret-list">
                                        {suggestions.deret.map((item, i) => <option key={i} value={item} />)}
                                    </datalist>
                                </div>
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
                            <Button onClick={handleSubmit} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
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
                                    <th className="p-3 font-medium">Deret</th>
                                    <th className="p-3 font-medium">Keterangan</th>
                                    <th className="p-3 font-medium">Tgl Terbit</th>
                                    <th className="p-3 font-medium text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isFetching ? (
                                    <tr>
                                        <td colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                                <ThreeBodyLoader size={45} color="#E91E63" />
                                                <p className="text-sm font-medium text-purple-600/80 animate-pulse">Memuat data Akta Perceraian...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : dataList.length === 0 ? (
                                    <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Belum ada data.</td></tr>
                                ) : (
                                    dataList.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/50">
                                            <td className="p-3">{item.no_akta}</td>
                                            <td className="p-3">
                                                <div className="font-medium text-purple-700">{item.nama_suami}</div>
                                                <div className="text-purple-600">& {item.nama_istri}</div>
                                            </td>
                                            <td className="p-3 font-medium text-blue-600">{item.deret || "-"}</td>
                                            <td className="p-3 text-muted-foreground italic text-xs truncate max-w-[150px]">{item.keterangan || "-"}</td>
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
                {dataList.length > 0 && (
                    <div className="p-4 border-t">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-sm text-muted-foreground order-2 sm:order-1">
                                Menampilkan halaman {currentPage + 1} dari {totalPages}
                            </div>
                            <div className="flex items-center gap-1 order-1 sm:order-2">
                                <Button
                                    variant="outline" size="icon"
                                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                    disabled={currentPage === 0}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {getPageNumbers().map((pageNum, idx) => (
                                    pageNum === -1 ? (
                                        <span key={`sep-${idx}`} className="mx-1 text-muted-foreground">...</span>
                                    ) : (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 p-0 ${currentPage === pageNum ? 'pointer-events-none' : ''}`}
                                        >
                                            {pageNum + 1}
                                        </Button>
                                    )
                                ))}
                                <Button
                                    variant="outline" size="icon"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={currentPage >= totalPages - 1}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}
