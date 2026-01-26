import { useState, useEffect } from "react"
import { toast } from "sonner"
import { ExcelActions } from "@/components/ExcelActions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { Plus, Trash2, X, FileDown, Search, Eye } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { logActivity } from "@/lib/logger"
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

interface KTPData {
    id: number
    nik: string
    nama_lengkap: string
    tempat_lahir: string
    tgl_lahir: string
    pekerjaan: string
    foto_dokumen?: string
    keterangan?: string
    deret?: string
    created_at: string
}

export function KTPForm() {
    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [dataList, setDataList] = useState<KTPData[]>([])
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [editId, setEditId] = useState<number | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        nik: "",
        nama: "",
        tempat_lahir: "",
        tgl_lahir: "",
        pekerjaan: "",
        keterangan: "",
        deret: ""
    })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [currentImage, setCurrentImage] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [searchDeret, setSearchDeret] = useState("")
    const [viewItem, setViewItem] = useState<KTPData | null>(null)

    // Get unique Deret values for filter dropdown
    const uniqueDeret = Array.from(new Set(dataList.map(item => item.deret).filter(Boolean))).sort()

    const filteredData = dataList.filter(item => {
        const matchesSearchTerm =
            item.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.pekerjaan && item.pekerjaan.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.keterangan && item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesDeret = searchDeret ? item.deret === searchDeret : true

        return matchesSearchTerm && matchesDeret
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsFetching(true)
        const { data, error } = await supabase
            .from("penduduk")
            .select("*")
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })

        if (!error && data) {
            setDataList(data)
        }
        setIsFetching(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleSubmit = async () => {
        // Validation
        if (!formData.nik || !formData.nama || !formData.tempat_lahir || !formData.tgl_lahir || !formData.pekerjaan) {
            toast.error("Semua field wajib harus diisi!")
            return
        }

        if (!/^\d{16}$/.test(formData.nik)) {
            toast.error("NIK harus 16 digit angka!")
            return
        }

        setLoading(true)
        try {
            let photoUrl = currentImage

            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop()
                const fileName = `ktp/${Date.now()}.${fileExt}`
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
                const { error } = await supabase.from("penduduk").update({
                    nik: formData.nik,
                    nama_lengkap: formData.nama,
                    tempat_lahir: formData.tempat_lahir,
                    tgl_lahir: formData.tgl_lahir,
                    pekerjaan: formData.pekerjaan,
                    foto_dokumen: photoUrl,
                    keterangan: formData.keterangan,
                    deret: formData.deret
                }).eq("id", editId)

                if (error) throw error
                await logActivity("UPDATE DATA KTP", `Memperbarui KTP NIK: ${formData.nik} (${formData.nama})`)
                toast.success("Data KTP berhasil diperbarui")
            } else {
                // Insert new
                const { error } = await supabase.from("penduduk").insert({
                    nik: formData.nik,
                    nama_lengkap: formData.nama,
                    tempat_lahir: formData.tempat_lahir,
                    tgl_lahir: formData.tgl_lahir,
                    pekerjaan: formData.pekerjaan,
                    foto_dokumen: photoUrl,
                    keterangan: formData.keterangan,
                    deret: formData.deret
                })

                if (error) throw error
                await logActivity("TAMBAH DATA KTP", `Menambahkan KTP NIK: ${formData.nik} (${formData.nama})`)
                toast.success("Data KTP berhasil disimpan")
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
        setFormData({ nik: "", nama: "", tempat_lahir: "", tgl_lahir: "", pekerjaan: "", keterangan: "", deret: "" })
        setSelectedFile(null)
        setCurrentImage(null)
        setShowForm(false)
        setEditId(null)
    }

    const handleView = (item: KTPData) => {
        setViewItem(item)
    }

    const handleEdit = (item: KTPData) => {
        setFormData({
            nik: item.nik,
            nama: item.nama_lengkap,
            tempat_lahir: item.tempat_lahir,
            tgl_lahir: item.tgl_lahir,
            pekerjaan: item.pekerjaan,
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

        const { error } = await supabase.from("penduduk").update({ is_deleted: true }).eq("id", deleteId)
        if (!error) {
            if (item) {
                await logActivity("HAPUS DATA KTP", `Memindahkan KTP NIK: ${item.nik} ke Sampah`)
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
                nik: String(item['NIK'] || item['nik'] || ''),
                nama_lengkap: item['Nama Lengkap'] || item['nama_lengkap'] || item['Nama'] || '',
                tempat_lahir: item['Tempat Lahir'] || item['tempat_lahir'] || '',
                tgl_lahir: item['Tanggal Lahir'] || item['tgl_lahir'] || null,
                pekerjaan: item['Pekerjaan'] || item['pekerjaan'] || '',
                keterangan: item['Keterangan'] || item['keterangan'] || '',
                deret: item['Deret'] || item['deret'] || ''
            })).filter(item => item.nik && item.nama_lengkap && item.nik.length === 16)

            if (validData.length === 0) {
                toast.error("Data tidak valid. Pastikan kolom NIK (16 digit), Nama Lengkap, dll benar.")
                setLoading(false)
                return
            }

            const { error } = await supabase.from('penduduk').upsert(validData, { onConflict: 'nik' })

            if (error) throw error

            await logActivity("IMPORT DATA KTP", `Mengimport ${validData.length} data via Excel`)
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

        doc.text("Laporan Data KTP Elektronik", 14, 15)
        doc.setFontSize(10)
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22)

        const tableData = dataList.map((item, index) => [
            index + 1,
            item.nik,
            item.nama_lengkap,
            `${item.tempat_lahir}, ${new Date(item.tgl_lahir).toLocaleDateString('id-ID')}`,
            item.pekerjaan,
            item.keterangan || '-',
            item.deret || '-'
        ])

        autoTable(doc, {
            head: [['No', 'NIK', 'Nama Lengkap', 'TTL', 'Pekerjaan', 'Keterangan', 'Deret']],
            body: tableData,
            startY: 25,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 8 }
        })

        doc.save(`Laporan_KTP_${new Date().getTime()}.pdf`)
    }

    return (
        <div className="space-y-6">
            {/* View Detail Dialog */}
            <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Detail KTP Elektronik</DialogTitle>
                        <DialogDescription>
                            Informasi lengkap data KTP Elektronik
                        </DialogDescription>
                    </DialogHeader>
                    {viewItem && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <span className="font-semibold">NIK</span>
                                    <span className="col-span-2">: {viewItem.nik}</span>

                                    <span className="font-semibold">Nama Lengkap</span>
                                    <span className="col-span-2">: {viewItem.nama_lengkap}</span>

                                    <span className="font-semibold">Tempat Lahir</span>
                                    <span className="col-span-2">: {viewItem.tempat_lahir}</span>

                                    <span className="font-semibold">Tanggal Lahir</span>
                                    <span className="col-span-2">: {formatDate(viewItem.tgl_lahir)}</span>

                                    <span className="font-semibold">Pekerjaan</span>
                                    <span className="col-span-2">: {viewItem.pekerjaan}</span>

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
                                            alt="Foto Fisik KTP"
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
                    <h2 className="text-2xl font-bold text-gray-800">Data KTP Elektronik</h2>
                    <p className="text-sm text-muted-foreground">Kelola data KTP Elektronik</p>
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
                            placeholder="Cari NIK / Nama / Ket..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <ExcelActions data={dataList} fileName="Data_KTP" onImport={handleImport} isLoading={loading} />
                        <Button variant="outline" onClick={handleDownloadPDF} className="gap-2 bg-red-50 text-red-700 hover:bg-red-100 border-red-200" title="Export Laporan PDF">
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
                        <CardTitle>{editId ? "Edit KTP Elektronik" : "Input KTP Elektronik Baru"}</CardTitle>
                        <CardDescription>
                            {editId ? "Perbarui data penduduk." : "Masukkan data penduduk untuk pembuatan KTP baru."}
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
                                        placeholder="Contoh: BOOK KTP 36"
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
                                label="Foto KTP / Bukti Pendukung"
                                currentImage={currentImage}
                                onImageCaptured={(file) => setSelectedFile(file)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSubmit} disabled={loading}>{loading ? "Menyimpan..." : (editId ? "Simpan Perubahan" : "Simpan Data KTP")}</Button>
                    </CardFooter>
                </Card>
            )
            }

            {/* Data List */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar KTP Tersimpan</CardTitle>
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
                            {searchTerm ? "Tidak ada data yang cocok dengan pencarian." : "Belum ada data KTP. Klik 'Tambah Data KTP' untuk menambahkan."}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-3 font-medium">NIK</th>
                                        <th className="text-left p-3 font-medium">Nama Lengkap</th>
                                        <th className="text-left p-3 font-medium">Deret</th>
                                        <th className="text-left p-3 font-medium">Keterangan</th>
                                        <th className="text-center p-3 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-3 font-mono text-xs">{item.nik}</td>
                                            <td className="p-3">{item.nama_lengkap}</td>
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
                </CardContent>
            </Card>
        </div >
    )
}
