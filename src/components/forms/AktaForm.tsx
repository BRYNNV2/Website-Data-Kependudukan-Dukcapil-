import { ThreeBodyLoader } from "@/components/ui/ThreeBodyLoader"
import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { ExcelActions } from "@/components/ExcelActions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { Plus, Trash2, X, FileDown, Search, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { logActivity } from "@/lib/logger"
import { compressImage } from "@/lib/imageCompression"
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
    keterangan?: string
    deret?: string
    created_at: string
}
export function AktaForm() {
    const [searchParams] = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [dataList, setDataList] = useState<AktaData[]>([])
    const [totalItems, setTotalItems] = useState(0)
    const [currentPage, setCurrentPage] = useState(0)
    const pageSize = 10
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [editId, setEditId] = useState<number | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        no_akta: "",
        nama_anak: "",
        nama_ayah: "",
        nama_ibu: "",
        tgl_lahir_anak: "",
        keterangan: "",
        deret: ""
    })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [currentImage, setCurrentImage] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    // Auto-search from URL param
    useEffect(() => {
        const query = searchParams.get("search")
        if (query) {
            setSearchTerm(query)
        }
    }, [searchParams])

    const [searchDeret, setSearchDeret] = useState("")
    const [viewItem, setViewItem] = useState<AktaData | null>(null)
    const [noAktaError, setNoAktaError] = useState<string | null>(null)
    const [isCheckingNoAkta, setIsCheckingNoAkta] = useState(false)

    // Get unique Deret values for filter dropdown (Server-side simplified)
    const uniqueDeret = useMemo(() => {
        return Array.from(new Set(dataList.map(item => item.deret).filter(Boolean))).sort()
    }, [dataList])

    // Server-side pagination calculation
    const totalPages = Math.ceil(totalItems / pageSize)

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(0)
    }, [searchTerm, searchDeret])

    // Fetch data when params change
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchData()
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [currentPage, searchTerm, searchDeret])


    // Real-time No. Akta Validation
    useEffect(() => {
        const checkNoAktaAvailability = async () => {
            if (!formData.no_akta || formData.no_akta.length < 3) {
                setNoAktaError(null)
                return
            }

            setIsCheckingNoAkta(true)
            try {
                // Check if No Akta exists in database
                let query = supabase
                    .from('akta_kelahiran')
                    .select('id, no_akta')
                    .eq('no_akta', formData.no_akta)
                    .eq('is_deleted', false)

                // If editing, allow same No Akta if it belongs to current record
                if (editId) {
                    query = query.neq('id', editId)
                }

                const { data, error } = await query

                if (error) throw error

                if (data && data.length > 0) {
                    setNoAktaError("Nomor Akta sudah terdaftar!")
                } else {
                    setNoAktaError(null)
                }
            } catch (error) {
                console.error("Error checking No Akta:", error)
            } finally {
                setIsCheckingNoAkta(false)
            }
        }

        const timeoutId = setTimeout(() => {
            checkNoAktaAvailability()
        }, 500) // Debounce 500ms

        return () => clearTimeout(timeoutId)
    }, [formData.no_akta, editId])

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
            .from("akta_kelahiran")
            .select("*", { count: "exact" })
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })
            .range(from, to)

        if (searchTerm) {
            query = query.or(`no_akta.ilike.%${searchTerm}%,nama_anak.ilike.%${searchTerm}%,nama_ayah.ilike.%${searchTerm}%,nama_ibu.ilike.%${searchTerm}%`)
        }

        if (searchDeret) {
            query = query.eq("deret", searchDeret)
        }

        const { data, count, error } = await query

        if (!error && data) {
            setDataList(data)
            setTotalItems(count || 0)
        }
        setIsFetching(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let value = e.target.value

        // Khusus No Akta: Angka, Huruf, Strip (-) diperbolehkan | Auto Uppercase
        if (e.target.id === 'no_akta') {
            value = value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase()
        }

        setFormData({ ...formData, [e.target.id]: value })

        if (e.target.id === 'no_akta') {
            setNoAktaError(null) // Reset temporary error while typing
        }
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
                const compressedFile = await compressImage(selectedFile) // Compress here
                const fileExt = compressedFile.name.split('.').pop()
                const fileName = `akta/${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('population_docs')
                    .upload(fileName, compressedFile)

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
                    foto_dokumen: photoUrl,
                    keterangan: formData.keterangan,
                    deret: formData.deret
                }).eq("id", editId)

                if (error) throw error
                await logActivity("UPDATE DATA AKTA", `Memperbarui Akta No: ${formData.no_akta} (${formData.nama_anak})`)
                toast.success("Data Akta Kelahiran berhasil diperbarui")
                window.dispatchEvent(new Event('trigger-notification-refresh'))
            } else {
                // Insert
                const { error } = await supabase.from("akta_kelahiran").insert({
                    no_akta: formData.no_akta,
                    nama_anak: formData.nama_anak,
                    nama_ayah: formData.nama_ayah,
                    nama_ibu: formData.nama_ibu,
                    tgl_lahir_anak: formData.tgl_lahir_anak,
                    foto_dokumen: photoUrl,
                    keterangan: formData.keterangan,
                    deret: formData.deret
                })

                if (error) throw error
                await logActivity("TAMBAH DATA AKTA", `Menambahkan Akta No: ${formData.no_akta} (${formData.nama_anak})`)
                toast.success("Data Akta Kelahiran berhasil disimpan")
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
        setFormData({ no_akta: "", nama_anak: "", nama_ayah: "", nama_ibu: "", tgl_lahir_anak: "", keterangan: "", deret: "" })
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
            tgl_lahir_anak: item.tgl_lahir_anak,
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

        const { error } = await supabase.from("akta_kelahiran").update({ is_deleted: true }).eq("id", deleteId)
        if (!error) {
            if (item) {
                await logActivity("HAPUS DATA AKTA", `Memindahkan Akta No: ${item.no_akta} ke Sampah`)
            }
            toast.success("Data dipindahkan ke Sampah")
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

    const handleImport = async (importedData: any[]) => {
        setLoading(true)
        try {
            const validData = importedData.map(item => ({
                no_akta: String(item['No Akta'] || item['no_akta'] || ''),
                nama_anak: item['Nama Anak'] || item['nama_anak'] || '',
                nama_ayah: item['Nama Ayah'] || item['nama_ayah'] || '',
                nama_ibu: item['Nama Ibu'] || item['nama_ibu'] || '',
                tgl_lahir_anak: item['Tanggal Lahir'] || item['tgl_lahir_anak'] || null,
                keterangan: item['Keterangan'] || item['keterangan'] || '',
                deret: item['Deret'] || item['deret'] || ''
            })).filter(item => item.nama_anak && item.tgl_lahir_anak)

            if (validData.length === 0) {
                toast.error("Data tidak valid. Pastikan kolom Nama Anak, dll benar.")
                setLoading(false)
                return
            }

            const { error } = await supabase.from('akta_kelahiran').upsert(validData, { onConflict: 'no_akta' })

            if (error) throw error

            await logActivity("IMPORT DATA AKTA KELAHIRAN", `Mengimport ${validData.length} data via Excel`)
            toast.success(`Berhasil mengimport ${validData.length} data`)
            fetchData()
        } catch (error: any) {
            toast.error("Gagal import: " + error.message)
        } finally {
            setLoading(false)
        }
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
            new Date(item.tgl_lahir_anak).toLocaleDateString('id-ID'),
            item.keterangan || '-',
            item.deret || '-'
        ])

        autoTable(doc, {
            head: [['No', 'No. Akta', 'Nama Anak', 'Nama Ayah', 'Nama Ibu', 'Tgl Lahir', 'Keterangan', 'Deret']],
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

                                    <span className="font-semibold">Keterangan</span>
                                    <span className="col-span-2">: {viewItem.keterangan || "-"}</span>

                                    <span className="font-semibold">Deret</span>
                                    <span className="col-span-2">: {viewItem.deret || "-"}</span>
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
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Data Akta Kelahiran</h2>
                    <p className="text-sm text-muted-foreground">Kelola data Akta Kelahiran</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto items-center">
                    {/* Filter Deret */}
                    <div className="w-full sm:w-40">
                        <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={searchDeret}
                            onChange={(e) => setSearchDeret(e.target.value)}
                        >
                            <option value="">Semua Deret</option>
                            {uniqueDeret.map((deret, index) => (
                                <option key={index} value={deret as string}>{deret}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari No. Akta / Nama / Ket..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <ExcelActions data={dataList} fileName="Data_Akta_Kelahiran" onImport={handleImport} isLoading={loading} />
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
                    }} className="gap-2 w-full sm:w-auto">
                        {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {showForm ? "Batal" : "Tambah Data"}
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
                            <Input
                                id="no_akta"
                                value={formData.no_akta}
                                onChange={handleChange}
                                placeholder="Nomor Registrasi Akta"
                                className={noAktaError ? "border-red-500 focus-visible:ring-red-500" : (formData.no_akta.length > 2 && !isCheckingNoAkta ? "border-green-500 focus-visible:ring-green-500" : "")}
                            />
                            {isCheckingNoAkta && <p className="text-xs text-muted-foreground mt-1 animate-pulse">Memeriksa ketersediaan No. Akta...</p>}
                            {!isCheckingNoAkta && noAktaError && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><X className="h-3 w-3" /> {noAktaError}</p>}
                            {!isCheckingNoAkta && !noAktaError && formData.no_akta.length > 2 && <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">✓ Nomor Akta tersedia</p>}
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

                        {/* New Fields: Keterangan & Deret */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="deret">Deret</Label>
                                <div className="relative">
                                    <Input
                                        id="deret"
                                        list="deret-list"
                                        placeholder="Contoh: 4"
                                        value={formData.deret}
                                        onChange={handleChange}
                                        autoComplete="off"
                                    />
                                    <datalist id="deret-list">
                                        {Array.from(new Set(dataList.map(item => item.deret).filter(Boolean))).sort().map((item, index) => (
                                            <option key={index} value={item} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="keterangan">Keterangan</Label>
                                <div className="relative">
                                    <Input
                                        id="keterangan"
                                        list="keterangan-list"
                                        placeholder="Contoh: BOOK AKTA 36"
                                        value={formData.keterangan}
                                        onChange={handleChange}
                                        autoComplete="off"
                                    />
                                    <datalist id="keterangan-list">
                                        {Array.from(new Set(dataList.map(item => item.keterangan).filter(Boolean))).sort().map((item, index) => (
                                            <option key={index} value={item} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
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
                        <Button onClick={handleSubmit} disabled={loading || isCheckingNoAkta || !!noAktaError} className={noAktaError ? "opacity-50 cursor-not-allowed" : ""}>
                            {loading ? "Menyimpan..." : (editId ? "Simpan Perubahan" : "Simpan Data Akta")}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Data List */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Akta Kelahiran Tersimpan</CardTitle>
                    <CardDescription>Total: {totalItems} data {searchTerm && `(Pencarian)`}</CardDescription>
                </CardHeader>
                <CardContent>
                    {isFetching ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <ThreeBodyLoader size={45} color="#F59E0B" />
                            <p className="text-sm font-medium text-orange-600/80 animate-pulse">Memuat data Akta Kelahiran...</p>
                        </div>
                    ) : dataList.length === 0 ? (
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
                                        <th className="text-left p-3 font-medium">Deret</th>
                                        <th className="text-left p-3 font-medium">Keterangan</th>
                                        <th className="text-center p-3 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataList.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-3 font-mono text-xs">{item.no_akta || "-"}</td>
                                            <td className="p-3">{item.nama_anak}</td>
                                            <td className="p-3 font-medium text-blue-600">{item.deret || "-"}</td>
                                            <td className="p-3 text-muted-foreground italic text-xs truncate max-w-[150px]">{item.keterangan || "-"}</td>
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

                    {dataList.length > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t gap-4">
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
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
