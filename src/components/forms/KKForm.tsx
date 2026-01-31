import { ThreeBodyLoader } from "@/components/ui/ThreeBodyLoader"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { Plus, Trash2, X, FileDown, Search, Eye, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { ExcelActions } from "@/components/ExcelActions"
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
import { ImageUploadCapture } from "@/components/ImageUploadCapture"

interface KKData {
    id: number
    no_kk: string
    kepala_keluarga: string
    alamat: string
    rt: string
    rw: string
    latitude?: number
    longitude?: number
    foto_dokumen?: string
    tanggal_dikeluarkan?: string
    keterangan?: string
    deret?: string
    created_at: string
}

export function KKForm() {
    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [dataList, setDataList] = useState<KKData[]>([])
    const [totalItems, setTotalItems] = useState(0)
    const [currentPage, setCurrentPage] = useState(0)
    const pageSize = 10
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [editId, setEditId] = useState<number | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        no_kk: "",
        kepala_keluarga: "",
        alamat: "",
        rt: "",
        rw: "",
        latitude: "",
        longitude: "",
        tanggal_dikeluarkan: "",
        keterangan: "",
        deret: ""
    })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [currentImage, setCurrentImage] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [searchDeret, setSearchDeret] = useState("")
    const [viewItem, setViewItem] = useState<KKData | null>(null)
    const [lastInput, setLastInput] = useState({ keterangan: "", deret: "" })
    const [noKkError, setNoKkError] = useState<string | null>(null)
    const [isCheckingNoKk, setIsCheckingNoKk] = useState(false)

    // Get unique Deret values from current data (simplified for server-side)
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



    // Real-time No. KK Validation
    useEffect(() => {
        const checkNoKkAvailability = async () => {
            if (!formData.no_kk || formData.no_kk.length < 16) {
                setNoKkError(null)
                return
            }

            setIsCheckingNoKk(true)
            try {
                // Check if No KK exists in database
                let query = supabase
                    .from('kartu_keluarga')
                    .select('id, no_kk')
                    .eq('no_kk', formData.no_kk)
                    .eq('is_deleted', false)

                // If editing, allow same No KK if it belongs to current record
                if (editId) {
                    query = query.neq('id', editId)
                }

                const { data, error } = await query

                if (error) throw error

                if (data && data.length > 0) {
                    setNoKkError("Nomor KK sudah terdaftar!")
                } else {
                    setNoKkError(null)
                }
            } catch (error) {
                console.error("Error checking No KK:", error)
            } finally {
                setIsCheckingNoKk(false)
            }
        }

        const timeoutId = setTimeout(() => {
            if (formData.no_kk.length === 16) {
                checkNoKkAvailability()
            }
        }, 500) // Debounce 500ms

        return () => clearTimeout(timeoutId)
    }, [formData.no_kk, editId])

    const fetchData = async () => {
        setIsFetching(true)
        const from = currentPage * pageSize
        const to = from + pageSize - 1

        let query = supabase
            .from("kartu_keluarga")
            .select("*", { count: "exact" })
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })
            .range(from, to)

        if (searchTerm) {
            query = query.or(`no_kk.ilike.%${searchTerm}%,kepala_keluarga.ilike.%${searchTerm}%,alamat.ilike.%${searchTerm}%`)
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
        setFormData({ ...formData, [e.target.id]: e.target.value })
        if (e.target.id === 'no_kk') {
            // Reset error immediately when user types to avoid stale error state
            if (e.target.value.length !== 16) setNoKkError(null)
        }
    }

    const handleSubmit = async () => {
        // Validation
        if (!formData.no_kk || !formData.kepala_keluarga || !formData.alamat || !formData.rt || !formData.rw || !formData.tanggal_dikeluarkan) {
            toast.error("Semua field wajib harus diisi!")
            return
        }

        if (!/^\d{16}$/.test(formData.no_kk)) {
            toast.error("Nomor KK harus 16 digit angka!")
            return
        }

        setLoading(true)
        try {
            let photoUrl = currentImage

            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop()
                const fileName = `kk/${Date.now()}.${fileExt}`
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
                // Update existing
                const { error } = await supabase.from("kartu_keluarga").update({
                    no_kk: formData.no_kk,
                    kepala_keluarga: formData.kepala_keluarga,
                    alamat: formData.alamat,
                    rt: formData.rt,
                    rw: formData.rw,
                    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                    foto_dokumen: photoUrl,
                    tanggal_dikeluarkan: formData.tanggal_dikeluarkan,
                    keterangan: formData.keterangan,
                    deret: formData.deret
                }).eq("id", editId)

                if (error) throw error
                await logActivity("UPDATE DATA KK", `Memperbarui KK No. ${formData.no_kk} (${formData.kepala_keluarga})`)
                toast.success("Data Kartu Keluarga berhasil diperbarui")
                window.dispatchEvent(new Event('trigger-notification-refresh'))
            } else {
                // Insert new
                const { error } = await supabase.from("kartu_keluarga").insert({
                    no_kk: formData.no_kk,
                    kepala_keluarga: formData.kepala_keluarga,
                    alamat: formData.alamat,
                    rt: formData.rt,
                    rw: formData.rw,
                    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                    foto_dokumen: photoUrl,
                    tanggal_dikeluarkan: formData.tanggal_dikeluarkan,
                    keterangan: formData.keterangan,
                    deret: formData.deret
                })

                if (error) throw error

                await logActivity("TAMBAH DATA KK", `Menambahkan KK No. ${formData.no_kk} (${formData.kepala_keluarga})`)
                toast.success("Data Kartu Keluarga berhasil disimpan")
                window.dispatchEvent(new Event('trigger-notification-refresh'))
            }

            const nextDefaults = !editId ? { keterangan: formData.keterangan || "", deret: formData.deret || "" } : undefined
            if (!editId && nextDefaults) setLastInput(nextDefaults)
            resetForm(nextDefaults)
            fetchData() // Refresh list
        } catch (error: any) {
            toast.error("Gagal menyimpan: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = (defaults?: { keterangan: string, deret: string }) => {
        const initial = defaults || lastInput
        setFormData({
            no_kk: "",
            kepala_keluarga: "",
            alamat: "",
            rt: "",
            rw: "",
            latitude: "",
            longitude: "",
            tanggal_dikeluarkan: "",
            keterangan: initial.keterangan,
            deret: initial.deret
        })
        setSelectedFile(null)
        setCurrentImage(null)
        setShowForm(false)
        setEditId(null)
    }

    const handleView = (item: KKData) => {
        setViewItem(item)
    }

    const handleEdit = (item: KKData) => {
        setFormData({
            no_kk: item.no_kk,
            kepala_keluarga: item.kepala_keluarga,
            alamat: item.alamat,
            rt: item.rt,
            rw: item.rw,
            latitude: item.latitude?.toString() || "",
            longitude: item.longitude?.toString() || "",
            tanggal_dikeluarkan: item.tanggal_dikeluarkan || "",
            keterangan: item.keterangan || "",
            deret: item.deret || ""
        })
        setCurrentImage(item.foto_dokumen || null)
        setEditId(item.id)
        setShowForm(true)
    }

    const confirmDelete = async () => {
        if (!deleteId) return

        const itemToDelete = dataList.find(d => d.id === deleteId)

        const { error } = await supabase.from("kartu_keluarga").update({ is_deleted: true }).eq("id", deleteId)
        if (!error) {
            if (itemToDelete) {
                await logActivity("HAPUS DATA KK", `Memindahkan KK No. ${itemToDelete.no_kk} ke Sampah`)
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

    const handleDownloadPDF = () => {
        const doc = new jsPDF()

        doc.text("Laporan Data Kartu Keluarga", 14, 15)
        doc.setFontSize(10)
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22)

        const tableData = dataList.map((item, index) => [
            index + 1,
            item.no_kk,
            item.kepala_keluarga,
            item.alamat,
            `${item.rt}/${item.rw}`,
            item.tanggal_dikeluarkan || '-',
            item.keterangan || '-',
            item.deret || '-'
        ])

        autoTable(doc, {
            head: [['No', 'No. KK', 'Kepala Keluarga', 'Alamat', 'RT/RW', 'Tgl Dikeluarkan', 'Keterangan', 'Deret']],
            body: tableData,
            startY: 25,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 8 }
        })

        doc.save(`Laporan_KK_${new Date().getTime()}.pdf`)
    }

    const handleImport = async (importedData: any[]) => {
        setLoading(true)
        try {
            const validData = importedData.map((row: any) => ({
                no_kk: (row["No. KK"] || row["no_kk"] || "").toString(),
                kepala_keluarga: row["Kepala Keluarga"] || row["kepala_keluarga"] || "",
                alamat: row["Alamat"] || row["alamat"] || "",
                rt: (row["RT"] || row["rt"] || "").toString(),
                rw: (row["RW"] || row["rw"] || "").toString(),
                tanggal_dikeluarkan: row["Tanggal Dikeluarkan"] || row["tanggal_dikeluarkan"] || null,
                latitude: parseFloat(row["Latitude"] || row["latitude"] || "0"),
                longitude: parseFloat(row["Longitude"] || row["longitude"] || "0"),
                keterangan: row["Keterangan"] || row["keterangan"] || "",
                deret: row["Deret"] || row["deret"] || ""
            })).filter((item: any) => item.no_kk && item.kepala_keluarga)

            if (validData.length === 0) {
                toast.error("Data tidak valid or kosong")
                setLoading(false)
                return
            }

            const { error } = await supabase.from('kartu_keluarga').upsert(validData, { onConflict: 'no_kk' })
            if (error) throw error

            await logActivity("IMPORT DATA KK", `Import ${validData.length} data via Excel`)
            toast.success("Import berhasil")
            fetchData()
        } catch (err: any) {
            toast.error("Gagal import: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* View Detail Dialog */}
            <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Detail Kartu Keluarga</DialogTitle>
                        <DialogDescription>
                            Informasi lengkap data Kartu Keluarga
                        </DialogDescription>
                    </DialogHeader>
                    {viewItem && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <span className="font-semibold">No. KK</span>
                                    <span className="col-span-2">: {viewItem.no_kk}</span>

                                    <span className="font-semibold">Kepala Keluarga</span>
                                    <span className="col-span-2">: {viewItem.kepala_keluarga}</span>

                                    <span className="font-semibold">Alamat</span>
                                    <span className="col-span-2">: {viewItem.alamat}</span>

                                    <span className="font-semibold">RT/RW</span>
                                    <span className="col-span-2">: {viewItem.rt} / {viewItem.rw}</span>

                                    <span className="font-semibold">Tanggal Dikeluarkan</span>
                                    <span className="col-span-2">: {viewItem.tanggal_dikeluarkan || "-"}</span>

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
                                            alt="Foto Fisik KK"
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

                    <div className="my-2">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Peringatan!</AlertTitle>
                            <AlertDescription>
                                Tindakan ini bersifat permanen. Pastikan Anda menghapus data yang benar.
                            </AlertDescription>
                        </Alert>
                    </div>

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
                    <h2 className="text-2xl font-bold text-gray-800">Data Kartu Keluarga</h2>
                    <p className="text-sm text-muted-foreground">Kelola data Kartu Keluarga</p>
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
                            placeholder="Cari No. KK / Nama / Ket..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <ExcelActions data={dataList} fileName="Data_Kartu_Keluarga" onImport={handleImport} isLoading={loading} />
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

            {/* Input Form (collapsible) */}
            {showForm && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>{editId ? "Edit Data Kartu Keluarga" : "Input Kartu Keluarga Baru"}</CardTitle>
                        <CardDescription>
                            {editId ? "Perbarui data Kartu Keluarga." : "Masukkan data Kartu Keluarga baru."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="no_kk">Nomor KK</Label>
                            <Input
                                id="no_kk"
                                value={formData.no_kk}
                                onChange={handleChange}
                                placeholder="16 digit Nomor KK"
                                className={noKkError ? "border-red-500 focus-visible:ring-red-500" : (formData.no_kk.length === 16 && !isCheckingNoKk ? "border-green-500 focus-visible:ring-green-500" : "")}
                            />
                            {isCheckingNoKk && <p className="text-xs text-muted-foreground mt-1 animate-pulse">Memeriksa ketersediaan No. KK...</p>}
                            {!isCheckingNoKk && noKkError && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><X className="h-3 w-3" /> {noKkError}</p>}
                            {!isCheckingNoKk && !noKkError && formData.no_kk.length === 16 && <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">✓ Nomor KK tersedia</p>}
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

                        <div className="space-y-2">
                            <Label htmlFor="tanggal_dikeluarkan">Tanggal Dikeluarkan</Label>
                            <Input
                                id="tanggal_dikeluarkan"
                                type="date"
                                value={formData.tanggal_dikeluarkan}
                                onChange={handleChange}
                            />
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
                                        placeholder="Contoh: BOOK KK 36"
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="latitude">Latitude (Koordinat)</Label>
                                <Input
                                    id="latitude"
                                    placeholder="Contoh: -6.200000"
                                    value={formData.latitude}
                                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="longitude">Longitude (Koordinat)</Label>
                                <Input
                                    id="longitude"
                                    placeholder="Contoh: 106.816666"
                                    value={formData.longitude}
                                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <ImageUploadCapture
                                label="Foto Kartu Keluarga (Fisik)"
                                currentImage={currentImage}
                                onImageCaptured={(file) => setSelectedFile(file)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSubmit} disabled={loading || isCheckingNoKk || !!noKkError} className={noKkError ? "opacity-50 cursor-not-allowed" : ""}>
                            {loading ? "Menyimpan..." : (deleteId ? "Simpan Perubahan" : "Simpan Data KK")}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Data List */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Kartu Keluarga Tersimpan</CardTitle>
                    <CardDescription>
                        Total: {totalItems} data {searchTerm && `(Pencarian)`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isFetching ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <ThreeBodyLoader size={45} color="#16A34A" />
                            <p className="text-sm font-medium text-green-600/80 animate-pulse">Memuat data Kartu Keluarga...</p>
                        </div>
                    ) : dataList.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchTerm ? "Tidak ada data yang cocok dengan pencarian." : "Belum ada data Kartu Keluarga. Klik 'Tambah Data KK' untuk menambahkan."}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-3 font-medium">No. KK</th>
                                        <th className="text-left p-3 font-medium">Kepala Keluarga</th>
                                        <th className="text-left p-3 font-medium">Deret</th>
                                        <th className="text-left p-3 font-medium">Keterangan</th>
                                        <th className="text-center p-3 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataList.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-3 font-mono text-xs">{item.no_kk}</td>
                                            <td className="p-3">{item.kepala_keluarga}</td>
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
