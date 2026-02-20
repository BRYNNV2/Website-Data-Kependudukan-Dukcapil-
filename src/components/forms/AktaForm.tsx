import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient" // Corrected import path
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Plus, Search, Trash2, Edit, FileDown, X, Eye } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { ExcelActions } from "@/components/ExcelActions"
import { ThreeBodyLoader } from "@/components/ui/ThreeBodyLoader"
import { logActivity } from "@/lib/logger"
import { ImageUploadCapture } from "@/components/ImageUploadCapture"
import { compressImage } from "@/lib/imageCompression"

// Helper function to parse Indonesian dates like "12 Juli 2002" or "DI TERBITKAN 12 JULI 2002"
const parseIndonesianDate = (dateString: string): string | null => {
    if (!dateString) return null;

    // Remove "DI TERBITKAN " prefix if exists (case insensitive)
    let cleanString = dateString.replace(/DI TERBITKAN\s+/i, '').trim();

    // Map Indonesian month names to English
    const months: { [key: string]: string } = {
        'JANUARI': 'January', 'FEBRUARI': 'February', 'MARET': 'March', 'APRIL': 'April',
        'MEI': 'May', 'JUNI': 'June', 'JULI': 'July', 'AGUSTUS': 'August',
        'SEPTEMBER': 'September', 'OKTOBER': 'October', 'NOVEMBER': 'November', 'DESEMBER': 'December',
        'JAN': 'Jan', 'FEB': 'Feb', 'MAR': 'Mar', 'APR': 'Apr', 'JUN': 'Jun',
        'JUL': 'Jul', 'AGU': 'Aug', 'SEP': 'Sep', 'OKT': 'Oct', 'NOV': 'Nov', 'DES': 'Dec'
    };

    // Replace month name
    for (const [indo, eng] of Object.entries(months)) {
        const regex = new RegExp(`\\b${indo}\\b`, 'i');
        if (regex.test(cleanString)) {
            // Replace with English month for parsing
            cleanString = cleanString.replace(regex, eng);
            break;
        }
    }

    // Try parsing
    const date = new Date(cleanString);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
    }

    return null; // Failed to parse
};

interface AktaData {
    id: number
    no_akta: string
    nama_anak: string
    nama_ayah: string
    nama_ibu: string
    tanggal_terbit?: string | null
    tgl_lahir_anak?: string
    agama?: string
    foto_dokumen?: string
    keterangan?: string
    deret?: string
    tipe_akta?: string // 'LT', 'LU', or 'DEFAULT'
    created_at: string
}

export function AktaForm() {
    const location = useLocation()

    // Determine Type based on URL structure
    let tipeAkta = 'DEFAULT' // Fallback for normal /akta-kelahiran route
    let pageTitle = 'Data Akta Kelahiran (Default)'

    if (location.pathname.endsWith('-lu')) {
        tipeAkta = 'LU'
        pageTitle = 'Data Akta Kelahiran LU'
    } else if (location.pathname.endsWith('-lt')) {
        tipeAkta = 'LT'
        pageTitle = 'Data Akta Kelahiran LT'
    }

    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [dataList, setDataList] = useState<AktaData[]>([])
    const [totalItems, setTotalItems] = useState(0)
    const [showForm, setShowForm] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [viewItem, setViewItem] = useState<AktaData | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        no_akta: "",
        nama_anak: "",
        nama_ayah: "",
        nama_ibu: "",
        tanggal_terbit: "",
        agama: "",
        keterangan: "",
        deret: "",
        tipe_akta: tipeAkta
    })

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [currentImage, setCurrentImage] = useState<string | null>(null)

    // Pagination & Search
    const [currentPage, setCurrentPage] = useState(0)
    const pageSize = 10
    const [searchTerm, setSearchTerm] = useState("")
    const [searchDeret, setSearchDeret] = useState("")
    const [deretOptions, setDeretOptions] = useState<string[]>([])

    // Validation
    const [isCheckingNoAkta, setIsCheckingNoAkta] = useState(false)
    const [noAktaError, setNoAktaError] = useState<string | null>(null)

    // Reset tipe when location changes
    useEffect(() => {
        setFormData(prev => ({ ...prev, tipe_akta: tipeAkta }))
        setCurrentPage(0) // Reset pagination
        setShowForm(false)
        setSearchTerm("")
    }, [tipeAkta])

    useEffect(() => {
        if (location.state?.refresh) {
            fetchData()
        }
    }, [location.state])

    useEffect(() => {
        fetchDeretOptions()
    }, [])

    const fetchDeretOptions = async () => {
        // Ambil unique deret untuk filter
        const { data } = await supabase
            .from("akta_kelahiran")
            .select("deret")
            .not("deret", "is", null)
            .order("deret")

        if (data) {
            const unique = Array.from(new Set(data.map(d => d.deret))).filter(Boolean) as string[]
            setDeretOptions(unique)
        }
    }

    // Debounce Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchData()
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [currentPage, searchTerm, searchDeret, tipeAkta])


    // Real-time No. Akta Validation
    useEffect(() => {
        if (!formData.no_akta || formData.no_akta.length < 3) {
            setNoAktaError(null)
            return
        }

        // Skip check if editing and no_akta hasn't changed (complex logic, simplified here: just check on submit mostly, but good for UX)
        // For now, let's keep it simple. Only check if it's NOT the item being edited.
        // We need existing data list to check locally or query db? DB is better.

        const checkAvailability = async () => {
            setIsCheckingNoAkta(true)
            const { data } = await supabase
                .from("akta_kelahiran")
                .select("id")
                .eq("no_akta", formData.no_akta)
                .neq("id", editId || -1) // Exclude current editing item
                .maybeSingle()

            setIsCheckingNoAkta(false)
            if (data) {
                setNoAktaError("Nomor Akta sudah digunakan!")
            } else {
                setNoAktaError(null)
            }
        }

        const timeout = setTimeout(checkAvailability, 500)
        return () => clearTimeout(timeout)
    }, [formData.no_akta, editId])


    const fetchData = async () => {
        setIsFetching(true)
        const from = currentPage * pageSize
        const to = from + pageSize - 1

        let query = supabase
            .from("akta_kelahiran")
            .select("*", { count: "exact" })
            .eq('tipe_akta', tipeAkta) // Filter by Type
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })
            .range(from, to)

        if (searchTerm) {
            query = query.or(`no_akta.ilike.%${searchTerm}%,nama_anak.ilike.%${searchTerm}%,nama_ayah.ilike.%${searchTerm}%,nama_ibu.ilike.%${searchTerm}%,agama.ilike.%${searchTerm}%`)
        }

        if (searchDeret) {
            query = query.eq("deret", searchDeret)
        }

        const { data, error, count } = await query

        if (error) {
            console.error("Error fetching data:", error)
            toast.error("Gagal memuat data.")
        }

        if (!error && data) {
            setDataList(data)
            setTotalItems(count || 0)
        }
        setIsFetching(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        let finalValue = value

        // Khusus No Akta: Angka, Huruf, Strip (-) diperbolehkan | Auto Uppercase
        if (name === 'no_akta') {
            finalValue = value.replace(/[^a-zA-Z0-9-\/.]/g, '').toUpperCase()
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }))

        // Clear error when user types in no_akta
        if (name === "no_akta") {
            setNoAktaError(null)
        }
    }

    const resetForm = () => {
        setFormData({
            no_akta: "",
            nama_anak: "",
            nama_ayah: "",
            nama_ibu: "",
            tanggal_terbit: "",
            agama: "",
            keterangan: "",
            deret: "",
            tipe_akta: tipeAkta
        })
        setSelectedFile(null)
        setCurrentImage(null)
        setShowForm(false)
        setEditId(null)
        setNoAktaError(null)
    }

    const handleSubmit = async () => {
        if (!formData.no_akta || !formData.nama_anak) {
            toast.error("Harap lengkapi No. Akta dan Nama Anak")
            return
        }

        if (noAktaError) {
            toast.error("Nomor Akta tidak valid atau sudah digunakan.")
            return
        }

        setLoading(true)
        try {
            let imageUrl = currentImage

            // Upload Image if selected
            if (selectedFile) {
                const compressedFile = await compressImage(selectedFile)
                const fileExt = compressedFile.name.split('.').pop()
                const fileName = `${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(`akta/${fileName}`, compressedFile)

                if (uploadError) throw uploadError

                const { data: publicData } = supabase.storage.from('documents').getPublicUrl(`akta/${fileName}`)
                imageUrl = publicData.publicUrl
            }

            if (editId) {
                // Update
                const { error } = await supabase.from("akta_kelahiran").update({
                    no_akta: formData.no_akta,
                    nama_anak: formData.nama_anak,
                    nama_ayah: formData.nama_ayah,
                    nama_ibu: formData.nama_ibu,
                    tanggal_terbit: formData.tanggal_terbit || null,
                    agama: formData.agama || null,
                    keterangan: formData.keterangan || null,
                    deret: formData.deret || null,
                    foto_dokumen: imageUrl,
                    tipe_akta: tipeAkta // Ensure type is correct
                }).eq("id", editId)

                if (error) throw error
                await logActivity("UPDATE DATA", `Mengubah data Akta Kelahiran: ${formData.nama_anak}`)
                toast.success("Data berhasil diperbarui")
            } else {
                // Insert
                const { error } = await supabase.from("akta_kelahiran").insert({
                    no_akta: formData.no_akta,
                    nama_anak: formData.nama_anak,
                    nama_ayah: formData.nama_ayah,
                    nama_ibu: formData.nama_ibu,
                    tanggal_terbit: formData.tanggal_terbit || null,
                    agama: formData.agama || null,
                    keterangan: formData.keterangan || null,
                    deret: formData.deret || null,
                    foto_dokumen: imageUrl,
                    tipe_akta: tipeAkta // Insert with type
                })

                if (error) throw error
                await logActivity("TAMBAH DATA", `Menambahkan Akta Kelahiran baru: ${formData.nama_anak}`)
                toast.success("Data berhasil disimpan")
            }

            fetchData()
            resetForm()
        } catch (error: any) {
            console.error("Error saving:", error)
            toast.error("Gagal menyimpan: " + error.message)
        } finally {
            setLoading(false)
        }
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
            tanggal_terbit: item.tanggal_terbit || "",
            agama: item.agama || "",
            keterangan: item.keterangan || "",
            deret: item.deret || "",
            tipe_akta: tipeAkta
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

    const handleImport = async (importedData: any[]) => {
        setLoading(true)
        try {
            // NORMALISASI KEYS (Ubah ke UpperCase & Trim Spasi)
            const normalizedData = importedData.map(item => {
                const newItem: any = {};
                Object.keys(item).forEach(key => {
                    const cleanKey = key.trim().toUpperCase();
                    newItem[cleanKey] = item[key];
                });
                return newItem;
            });

            const validData = normalizedData.map(item => {
                // 1. Ambil No. Akta (Support KODE ARSIP)
                const noAkta = String(
                    item['KODE ARSIP'] || item['KODE AKTA KELAHIRAN'] ||
                    item['NO. AKTA'] || item['NO AKTA'] ||
                    item['KODE AKTA'] || item['no_akta'] || ''
                );

                // 2. Parsed Tanggal
                const rawTahun = String(
                    item['TANGGAL TERBIT'] || item['TAHUN TERBIT'] ||
                    item['TAHUN'] || item['TANGGAL'] || ''
                );
                let parsedDate = parseIndonesianDate(rawTahun);

                // 3. Fallback Parse Date from No Akta
                if (!parsedDate && noAkta) {
                    const dateMatch = noAkta.match(/[-](\d{8})[-]/); // Cari -12012023-
                    if (dateMatch && dateMatch[1]) {
                        const dateStr = dateMatch[1];
                        const d = dateStr.substring(0, 2);
                        const m = dateStr.substring(2, 4);
                        const y = dateStr.substring(4, 8);
                        if (!isNaN(Number(d)) && !isNaN(Number(m)) && !isNaN(Number(y))) {
                            parsedDate = `${y}-${m}-${d}`;
                        }
                    } else {
                        // Coba regex umum 8 digit
                        const dateMatchGen = noAkta.match(/(\d{8})/);
                        if (dateMatchGen && dateMatchGen[1]) {
                            const dateStr = dateMatchGen[1];
                            const d = dateStr.substring(0, 2);
                            const m = dateStr.substring(2, 4);
                            const y = dateStr.substring(4, 8);
                            if (Number(d) <= 31 && Number(m) <= 12 && Number(y) > 1900) {
                                parsedDate = `${y}-${m}-${d}`;
                            }
                        }
                    }
                }

                return {
                    no_akta: noAkta,
                    nama_anak: item['NAMA ANAK'] || item['NAMA'] || '',
                    nama_ayah: item['NAMA AYAH'] || item['AYAH'] || '-',
                    nama_ibu: item['NAMA IBU'] || item['IBU'] || '-',
                    tanggal_terbit: parsedDate,
                    agama: item['AGAMA'] || '',
                    foto_dokumen: null,
                    keterangan: item['KETERANGAN'] || item['KET'] || '',
                    deret: item['DERET'] || '',
                    tipe_akta: tipeAkta
                }
            }).filter(item => {
                return item.no_akta && item.nama_anak;
            })

            const invalidCount = importedData.length - validData.length

            // Dedup within file
            const uniqueDataMap = new Map();
            validData.forEach(item => {
                uniqueDataMap.set(item.no_akta, item);
            });
            const uniqueData = Array.from(uniqueDataMap.values());

            const duplicateCount = validData.length - uniqueData.length
            const skippedCount = invalidCount + duplicateCount

            if (uniqueData.length === 0) {
                const firstItem = normalizedData[0] || {};
                const keysInfo = Object.keys(firstItem).join(", ");
                toast.error(`Gagal! ${importedData.length} data tidak valid. Kolom terbaca: [${keysInfo}]`)
                setLoading(false)
                return
            }

            if (skippedCount > 0) {
                toast.warning(`Info Import: ${uniqueData.length} siap diproses. ${skippedCount} data di-skip (${duplicateCount} duplikat No.Akta, ${invalidCount} format salah).`)
            }

            // CEK DATA EKSISTING DI DB UNTUK MEMPERTAHANKAN TIPE_AKTA LAMA
            const noAktaList = uniqueData.map(d => d.no_akta)
            const existingTypesMap = new Map<string, string>();
            const chunkSize = 1000;

            for (let i = 0; i < noAktaList.length; i += chunkSize) {
                const chunk = noAktaList.slice(i, i + chunkSize);
                const { data: existingData } = await supabase
                    .from('akta_kelahiran')
                    .select('no_akta, tipe_akta')
                    .in('no_akta', chunk);

                if (existingData) {
                    existingData.forEach((row: any) => {
                        existingTypesMap.set(row.no_akta, row.tipe_akta);
                    });
                }
            }

            const dataToUpsert = uniqueData.map(item => {
                const existingType = existingTypesMap.get(item.no_akta);
                return {
                    ...item,
                    tipe_akta: existingType || item.tipe_akta
                };
            });

            const { error } = await supabase.from('akta_kelahiran').upsert(dataToUpsert, { onConflict: 'no_akta' })

            if (error) throw error

            await logActivity("IMPORT DATA AKTA KELAHIRAN", `Mengimport ${dataToUpsert.length} data via Excel`)
            toast.success(`Berhasil mengimport ${dataToUpsert.length} data`)
            fetchData()
            fetchDeretOptions()
        } catch (error: any) {
            console.error("Import Error:", error)
            toast.error("Gagal import: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadPDF = () => {
        const doc = new jsPDF()
        doc.text(`Laporan ${pageTitle}`, 14, 10)

        autoTable(doc, {
            head: [['No. Akta', 'Nama Anak', 'Nama Ayah', 'Nama Ibu', 'Tgl Terbit', 'Agama', 'Deret']],
            body: dataList.map(item => [
                item.no_akta,
                item.nama_anak,
                item.nama_ayah,
                item.nama_ibu,
                item.tanggal_terbit ? new Date(item.tanggal_terbit).toLocaleDateString("id-ID") : "-",
                (item.agama && item.agama !== "LAINNYA") ? item.agama : "-",
                item.deret || "-"
            ]),
        })

        doc.save(`${pageTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`)
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

                                    <span className="font-semibold">Tanggal Terbit</span>
                                    <span className="col-span-2">: {viewItem.tanggal_terbit ? new Date(viewItem.tanggal_terbit).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}</span>

                                    {/* AGAMA DETAIL */}
                                    <span className="font-semibold">Agama</span>
                                    <span className="col-span-2">: {(viewItem.agama && viewItem.agama !== "LAINNYA") ? viewItem.agama : "-"}</span>

                                    <span className="font-semibold">Keterangan</span>
                                    <span className="col-span-2">: {viewItem.keterangan || "-"}</span>

                                    <span className="font-semibold">Deret</span>
                                    <span className="col-span-2">: {viewItem.deret || "-"}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Bukti Fisik / Foto</Label>
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
                    <h2 className="text-2xl font-bold text-gray-800">{pageTitle}</h2>
                    <p className="text-sm text-muted-foreground">Kelola data {pageTitle}</p>
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
                            {deretOptions.map((deret, index) => (
                                <option key={index} value={deret as string}>{deret}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari No. Akta / Nama / Agama..."
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
                        <CardTitle>{editId ? `Edit ${pageTitle}` : `Input ${pageTitle} Baru`}</CardTitle>
                        <CardDescription>
                            {editId ? `Perbarui data ${pageTitle}.` : "Masukkan data kelahiran untuk penerbitan Akta."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="no_akta">Nomor Akta (jika ada)</Label>
                            <Input
                                id="no_akta"
                                name="no_akta"
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
                            <Input id="nama_anak" name="nama_anak" value={formData.nama_anak} onChange={handleChange} placeholder="Nama Lengkap Anak" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nama_ayah">Nama Ayah</Label>
                                <Input id="nama_ayah" name="nama_ayah" value={formData.nama_ayah} onChange={handleChange} placeholder="Nama Lengkap Ayah" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nama_ibu">Nama Ibu</Label>
                                <Input id="nama_ibu" name="nama_ibu" value={formData.nama_ibu} onChange={handleChange} placeholder="Nama Lengkap Ibu" />
                            </div>
                        </div>

                        {/* TANGGAL TERBIT & AGAMA GRID */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tanggal_terbit">Tanggal Terbit</Label>
                                <Input
                                    id="tanggal_terbit"
                                    name="tanggal_terbit"
                                    type="date"
                                    value={formData.tanggal_terbit || ''}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* AGAMA INPUT (ONLY FOR DEFAULT TYPE) */}
                            {tipeAkta === 'DEFAULT' && (
                                <div className="space-y-2">
                                    <Label htmlFor="agama">Agama (Opsional)</Label>
                                    <select
                                        id="agama"
                                        name="agama"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.agama || ""}
                                        onChange={handleChange}
                                    >
                                        <option value="">LAINNYA / KOSONG</option>
                                        <option value="ISLAM">ISLAM</option>
                                        <option value="KRISTEN">KRISTEN</option>
                                        <option value="KATOLIK">KATOLIK</option>
                                        <option value="HINDU">HINDU</option>
                                        <option value="BUDDHA">BUDDHA</option>
                                        <option value="KHONGHUCU">KHONGHUCU</option>
                                        <option value="PRIBUMI">PRIBUMI</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* New Fields: Keterangan & Deret */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="deret">Deret</Label>
                                <div className="relative">
                                    <Input
                                        id="deret"
                                        name="deret"
                                        list="deret-list"
                                        placeholder="Contoh: 4"
                                        value={formData.deret}
                                        onChange={handleChange}
                                        autoComplete="off"
                                    />
                                    <datalist id="deret-list">
                                        {deretOptions.map((item, index) => (
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
                                        name="keterangan"
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
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b bg-muted/50">
                                        <TableHead className="text-left p-3 font-medium">No. Akta</TableHead>
                                        <TableHead className="text-left p-3 font-medium">Nama Anak</TableHead>
                                        <TableHead className="text-left p-3 font-medium">Tanggal Terbit</TableHead>
                                        {/* Show Agama Column Only on Default */}
                                        {tipeAkta === 'DEFAULT' && <TableHead className="text-left p-3 font-medium">Agama</TableHead>}
                                        <TableHead className="text-left p-3 font-medium">Deret</TableHead>
                                        <TableHead className="text-left p-3 font-medium">Keterangan</TableHead>
                                        <TableHead className="text-center p-3 font-medium">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dataList.map((item) => (
                                        <TableRow key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <TableCell className="p-3 font-mono text-xs">{item.no_akta || "-"}</TableCell>
                                            <TableCell className="p-3">{item.nama_anak}</TableCell>
                                            <TableCell className="p-3">{item.tanggal_terbit ? new Date(item.tanggal_terbit).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}</TableCell>

                                            {/* Agama Cell */}
                                            {tipeAkta === 'DEFAULT' && <TableCell className="p-3">{(item.agama && item.agama !== "LAINNYA") ? item.agama : "-"}</TableCell>}

                                            <TableCell className="p-3 font-medium text-blue-600">{item.deret || "-"}</TableCell>
                                            <TableCell className="p-3 text-muted-foreground italic text-xs truncate max-w-[150px]">{item.keterangan || "-"}</TableCell>
                                            <TableCell className="p-3 text-center flex items-center justify-center gap-2">
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
                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => handleEdit(item)}
                                                    title="Edit Data"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(item.id)}
                                                    title="Hapus Data"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t px-6 py-4">
                    <div className="text-xs text-muted-foreground">
                        Menampilkan {dataList.length > 0 ? currentPage * pageSize + 1 : 0} - {Math.min((currentPage + 1) * pageSize, totalItems)} dari {totalItems} data
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0 || isFetching}
                        >
                            <span className="sr-only">Sebelumnya</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m15 18-6-6 6-6" /></svg>
                        </Button>

                        {(() => {
                            const totalPages = Math.ceil(totalItems / pageSize)
                            const maxVisible = 5
                            let pages = []

                            if (totalPages <= maxVisible + 2) {
                                for (let i = 0; i < totalPages; i++) pages.push(i)
                            } else {
                                if (currentPage < 3) {
                                    pages = [0, 1, 2, 3, 4, -1, totalPages - 1]
                                } else if (currentPage >= totalPages - 3) {
                                    pages = [0, -1, totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1]
                                } else {
                                    pages = [0, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages - 1]
                                }
                            }

                            return pages.map((page, idx) => (
                                page === -1 ? (
                                    <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground text-xs">...</span>
                                ) : (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="icon"
                                        className="h-8 w-8 text-xs"
                                        onClick={() => setCurrentPage(page as number)}
                                        disabled={isFetching}
                                    >
                                        {(page as number) + 1}
                                    </Button>
                                )
                            ))
                        })()}

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(Math.min(Math.ceil(totalItems / pageSize) - 1, currentPage + 1))}
                            disabled={currentPage >= Math.ceil(totalItems / pageSize) - 1 || isFetching}
                        >
                            <span className="sr-only">Selanjutnya</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m9 18 6-6-6-6" /></svg>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
