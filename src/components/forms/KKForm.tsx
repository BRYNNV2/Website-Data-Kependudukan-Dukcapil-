import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { Plus, Trash2, X, FileDown, Search, Eye, FileSpreadsheet, Upload } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
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
    created_at: string
}

export function KKForm() {
    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [dataList, setDataList] = useState<KKData[]>([])
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
        longitude: ""
    })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [currentImage, setCurrentImage] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [viewItem, setViewItem] = useState<KKData | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const filteredData = dataList.filter(item =>
        item.no_kk.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kepala_keluarga.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.alamat.toLowerCase().includes(searchTerm.toLowerCase())
    )

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
        // Validation
        if (!formData.no_kk || !formData.kepala_keluarga || !formData.alamat || !formData.rt || !formData.rw) {
            toast.error("Semua field harus diisi!")
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
                    // Start bucket creation if not exists (handling this in code is hard, assume it exists or fail gracefully)
                    // For now, if upload fails, we warn but proceed? No, that defeats the purpose.
                    // We will try to rely on the bucket existing.
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
                    foto_dokumen: photoUrl
                }).eq("id", editId)

                if (error) throw error
                toast.success("Data Kartu Keluarga berhasil diperbarui")
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
                    foto_dokumen: photoUrl
                })

                if (error) throw error
                toast.success("Data Kartu Keluarga berhasil disimpan")
            }

            resetForm()
            fetchData() // Refresh list
        } catch (error: any) {
            toast.error("Gagal menyimpan: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            no_kk: "",
            kepala_keluarga: "",
            alamat: "",
            rt: "",
            rw: "",
            latitude: "",
            longitude: ""
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
            longitude: item.longitude?.toString() || ""
        })
        setCurrentImage(item.foto_dokumen || null)
        setEditId(item.id)
        setShowForm(true)
    }

    // ... delete and pdf functions


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
            `${item.rt}/${item.rw}`
        ])

        autoTable(doc, {
            head: [['No', 'No. KK', 'Kepala Keluarga', 'Alamat', 'RT/RW']],
            body: tableData,
            startY: 25,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 8 }
        })

        doc.save(`Laporan_KK_${new Date().getTime()}.pdf`)
    }

    const handleExportExcel = () => {
        const exportData = filteredData.map(item => ({
            "No. KK": item.no_kk,
            "Kepala Keluarga": item.kepala_keluarga,
            "Alamat": item.alamat,
            "RT": item.rt,
            "RW": item.rw,
            "Latitude": item.latitude,
            "Longitude": item.longitude
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data KK");
        XLSX.writeFile(workbook, `Data_KK_${new Date().getTime()}.xlsx`);
    }

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            const importedData = data.map((row: any) => ({
                no_kk: (row["No. KK"] || row["no_kk"] || "").toString(),
                kepala_keluarga: row["Kepala Keluarga"] || row["kepala_keluarga"],
                alamat: row["Alamat"] || row["alamat"],
                rt: (row["RT"] || row["rt"] || "").toString(),
                rw: (row["RW"] || row["rw"] || "").toString(),
                latitude: row["Latitude"] || row["latitude"] || null,
                longitude: row["Longitude"] || row["longitude"] || null
            })).filter((item: any) => item.no_kk && item.kepala_keluarga);

            if (importedData.length === 0) {
                toast.error("Tidak ada data valid yang ditemukan.");
                return;
            }

            setLoading(true);
            try {
                const { error } = await supabase.from('kartu_keluarga').insert(importedData);
                if (error) throw error;
                toast.success(`${importedData.length} data berhasil diimport!`);
                fetchData();
            } catch (err: any) {
                toast.error("Gagal import: " + err.message);
            } finally {
                setLoading(false);
                if (e.target) e.target.value = "";
            }
        };
        reader.readAsBinaryString(file);
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
                    <h2 className="text-2xl font-bold text-gray-800">Data Kartu Keluarga</h2>
                    <p className="text-sm text-muted-foreground">Kelola data Kartu Keluarga</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari No. KK / Nama / Alamat..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImportExcel}
                            accept=".xlsx, .xls"
                            className="hidden"
                        />
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2 bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200" title="Import data dari Excel">
                            <Upload className="h-4 w-4" />
                            Import
                        </Button>
                        <Button variant="outline" onClick={handleExportExcel} className="gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200" title="Export data ke Excel">
                            <FileSpreadsheet className="h-4 w-4" />
                            Excel
                        </Button>
                        <Button variant="outline" onClick={handleDownloadPDF} className="gap-2 bg-red-50 text-red-700 hover:bg-red-100 border-red-200" title="Export Laporan PDF">
                            <FileDown className="h-4 w-4" />
                            PDF
                        </Button>
                    </div>
                    <Button onClick={() => {
                        if (showForm) {
                            resetForm()
                        } else {
                            setShowForm(true)
                        }
                    }} className="gap-2">
                        {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {showForm ? "Batal" : "Tambah Data KK"}
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
                        <Button onClick={handleSubmit} disabled={loading}>
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
                        Total: {dataList.length} data {searchTerm && `(Ditemukan: ${filteredData.length})`}
                    </CardDescription>
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
                            {searchTerm ? "Tidak ada data yang cocok dengan pencarian." : "Belum ada data Kartu Keluarga. Klik 'Tambah Data KK' untuk menambahkan."}
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
                                    {filteredData.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-3 font-mono text-xs">{item.no_kk}</td>
                                            <td className="p-3">{item.kepala_keluarga}</td>
                                            <td className="p-3 text-muted-foreground">{item.alamat || "-"}</td>
                                            <td className="p-3">{item.rt || "-"}/{item.rw || "-"}</td>
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
