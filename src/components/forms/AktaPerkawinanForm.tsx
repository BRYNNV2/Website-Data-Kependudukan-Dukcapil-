import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { ExcelActions } from "@/components/ExcelActions"
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

interface AktaPerkawinanData {
    id: number
    no_akta: string
    nama_suami: string
    nama_istri: string
    tanggal_terbit: string
    agama: string
    foto_dokumen?: string
    keterangan?: string
    deret?: string
    jenis?: string
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
        agama: "",
        jenis: "Biasa",
        keterangan: "",
        deret: ""
    })
    const [suggestions, setSuggestions] = useState({
        keterangan: [] as string[],
        deret: [] as string[]
    })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [currentImage, setCurrentImage] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedYear, setSelectedYear] = useState<string>("all")
    const [selectedReligion, setSelectedReligion] = useState<string>("all")
    const [selectedType, setSelectedType] = useState<string>("all")
    const [selectedDeret, setSelectedDeret] = useState<string>("all")
    const [viewItem, setViewItem] = useState<AktaPerkawinanData | null>(null)

    const availableYears = useMemo(() => {
        const years = dataList.map(item => new Date(item.tanggal_terbit).getFullYear().toString())
        return [...new Set(years)].sort((a, b) => b.localeCompare(a))
    }, [dataList])

    const uniqueDeretList = useMemo(() => {
        return [...new Set(dataList.map(item => item.deret).filter(Boolean))].sort() as string[]
    }, [dataList])

    const filteredData = dataList.filter(item => {
        const matchesSearch = item.no_akta.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.nama_suami.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.nama_istri.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.keterangan && item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesYear = selectedYear === "all" || new Date(item.tanggal_terbit).getFullYear().toString() === selectedYear
        const matchesReligion = selectedReligion === "all" || item.agama === selectedReligion
        const matchesType = selectedType === "all" || (item.jenis || "Biasa") === selectedType
        const matchesDeret = selectedDeret === "all" || item.deret === selectedDeret

        return matchesSearch && matchesYear && matchesReligion && matchesType && matchesDeret
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsFetching(true)
        const { data, error } = await supabase
            .from("akta_perkawinan")
            .select("*")
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })

        if (!error && data) {
            setDataList(data)
            // Extract unique values for suggestions
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
                    jenis: formData.jenis,
                    keterangan: formData.keterangan,
                    deret: formData.deret,
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
                    jenis: formData.jenis || "Biasa",
                    keterangan: formData.keterangan,
                    deret: formData.deret,
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
        setFormData({ no_akta: "", nama_suami: "", nama_istri: "", tanggal_terbit: "", agama: "", jenis: "Biasa", keterangan: "", deret: "" })
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
            agama: item.agama,
            jenis: item.jenis || "Biasa",
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

        const { error } = await supabase.from("akta_perkawinan").update({ is_deleted: true }).eq("id", deleteId)
        if (!error) {
            if (item) await logActivity("HAPUS AKTA PERKAWINAN", `Memindahkan No. ${item.no_akta} ke Sampah`)
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
                agama: item['Agama'] || item['agama'] || '',
                keterangan: item['Keterangan'] || item['keterangan'] || '',
                deret: item['Deret'] || item['deret'] || '',
                jenis: item['Jenis'] || item['jenis'] || 'Biasa'
            })).filter(item => item.nama_suami && item.nama_istri)

            if (validData.length === 0) {
                toast.error("Data valid tidak ditemukan")
                setLoading(false)
                return
            }

            const { error } = await supabase.from('akta_perkawinan').upsert(validData, { onConflict: 'no_akta' })
            if (error) throw error

            await logActivity("IMPORT DATA PERKAWINAN", `Import ${validData.length} data`)
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
        doc.text("Laporan Data Akta Perkawinan", 14, 15)
        doc.setFontSize(10)
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22)

        const tableData = dataList.map((item, index) => [
            index + 1,
            item.no_akta,
            item.nama_suami,
            item.nama_istri,
            `${item.agama} (${new Date(item.tanggal_terbit).toLocaleDateString('id-ID')})`,
            item.keterangan || '-',
            item.deret || '-'
        ])

        autoTable(doc, {
            head: [['No', 'No. Akta', 'Suami', 'Istri', 'Agama & Tgl', 'Keterangan', 'Deret']],
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
                                    <span className="font-semibold text-muted-foreground">No. Akta:</span>
                                    <span>
                                        {viewItem.no_akta}
                                        {viewItem.jenis === 'Campuran' && <span className="ml-2 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full border border-purple-200">Campuran</span>}
                                        {viewItem.jenis === 'Umum' && <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">Umum</span>}
                                    </span>
                                    <span className="font-semibold text-muted-foreground">Keterangan:</span>
                                    <span>{viewItem.keterangan || "-"}</span>
                                    <span className="font-semibold text-muted-foreground">Deret:</span>
                                    <span>{viewItem.deret || "-"}</span>
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

            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Data Akta Perkawinan</h2>
                    <p className="text-sm text-muted-foreground">Kelola pencatatan perkawinan penduduk.</p>
                </div>

                <div className="flex flex-col gap-2 w-full xl:w-auto">
                    {/* Filters Row */}
                    <div className="flex flex-wrap gap-2 w-full xl:justify-end">
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-full sm:w-32 bg-white">
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tahun</SelectItem>
                                {availableYears.map(year => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedReligion} onValueChange={setSelectedReligion}>
                            <SelectTrigger className="w-full sm:w-32 bg-white">
                                <SelectValue placeholder="Agama" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Agama</SelectItem>
                                <SelectItem value="Islam">Islam</SelectItem>
                                <SelectItem value="Kristen">Kristen</SelectItem>
                                <SelectItem value="Nasrani">Nasrani</SelectItem>
                                <SelectItem value="Katolik">Katolik</SelectItem>
                                <SelectItem value="Hindu">Hindu</SelectItem>
                                <SelectItem value="Buddha">Buddha</SelectItem>
                                <SelectItem value="Konghucu">Konghucu</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger className="w-full sm:w-32 bg-white">
                                <SelectValue placeholder="Jenis" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Jenis</SelectItem>
                                <SelectItem value="Biasa">Biasa / Default</SelectItem>
                                <SelectItem value="Umum">Umum</SelectItem>
                                <SelectItem value="Campuran">Campuran</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={selectedDeret} onValueChange={setSelectedDeret}>
                            <SelectTrigger className="w-full sm:w-32 bg-white">
                                <SelectValue placeholder="Deret" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Deret</SelectItem>
                                {uniqueDeretList.map(d => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Actions Row */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto items-center xl:justify-end">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari..."
                                className="pl-8 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <ExcelActions data={dataList} fileName="Data_Akta_Perkawinan" onImport={handleImport} isLoading={loading} />
                            <Button variant="outline" onClick={handleDownloadPDF} className="gap-2 text-pink-600 border-pink-200 bg-pink-50 hover:bg-pink-100" title="Export Laporan PDF">
                                <FileDown className="h-4 w-4" />
                                Export PDF
                            </Button>
                        </div>

                        <Button onClick={() => {
                            if (showForm) {
                                resetForm()
                            } else {
                                setShowForm(true)
                            }
                        }} className="gap-2 bg-pink-600 hover:bg-pink-700 w-full sm:w-auto">
                            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            {showForm ? "Batal" : "Tambah"}
                        </Button>
                    </div>
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
                                <Label htmlFor="jenis">Jenis Perkawinan</Label>
                                <Select
                                    value={formData.jenis}
                                    onValueChange={(value) => setFormData({ ...formData, jenis: value })}
                                >
                                    <SelectTrigger id="jenis" className="bg-white">
                                        <SelectValue placeholder="Pilih Jenis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Biasa">Biasa / Default</SelectItem>
                                        <SelectItem value="Umum">Umum</SelectItem>
                                        <SelectItem value="Campuran">Campuran</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="no_akta">No. Surat Akta Perkawinan</Label>
                                <Input id="no_akta" value={formData.no_akta} onChange={handleChange} placeholder="Contoh: 123/PK/2024" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="keterangan">Keterangan</Label>
                                    <Input
                                        id="keterangan"
                                        list="ket-list"
                                        value={formData.keterangan}
                                        onChange={handleChange}
                                        placeholder="BOOK AP 36"
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
                                        placeholder="4"
                                    />
                                    <datalist id="deret-list">
                                        {suggestions.deret.map((item, i) => <option key={i} value={item} />)}
                                    </datalist>
                                </div>
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
                                        <SelectItem value="Nasrani">Nasrani</SelectItem>
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
                                    <th className="p-3 font-medium">No. Akta</th>
                                    <th className="p-3 font-medium">Suami & Istri</th>
                                    <th className="p-3 font-medium">Agama</th>
                                    <th className="p-3 font-medium hidden md:table-cell">Deret</th>
                                    <th className="p-3 font-medium hidden md:table-cell">Keterangan</th>
                                    <th className="p-3 font-medium text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isFetching ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                                                <p>Memuat data...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Belum ada data.</td></tr>
                                ) : (
                                    filteredData.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/50">
                                            <td className="p-3">
                                                {item.no_akta}
                                                {item.jenis === 'Campuran' && <div className="mt-1"><span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">Campuran</span></div>}
                                                {item.jenis === 'Umum' && <div className="mt-1"><span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">Umum</span></div>}
                                                {item.jenis !== 'Campuran' && item.jenis !== 'Umum' && <div className="mt-1"><span className="text-[10px] text-muted-foreground">Biasa</span></div>}
                                            </td>
                                            <td className="p-3">
                                                <div className="font-medium text-pink-700">{item.nama_suami}</div>
                                                <div className="text-pink-600">& {item.nama_istri}</div>
                                            </td>
                                            <td className="p-3">
                                                <div>{item.agama}</div>
                                                <div className="text-xs text-muted-foreground">{new Date(item.tanggal_terbit).toLocaleDateString("id-ID")}</div>
                                            </td>
                                            <td className="p-3 font-medium text-blue-600 hidden md:table-cell">{item.deret || "-"}</td>
                                            <td className="p-3 text-muted-foreground italic text-xs truncate max-w-[150px] hidden md:table-cell">{item.keterangan || "-"}</td>
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
