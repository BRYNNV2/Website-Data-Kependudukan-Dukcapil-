import { useState, useEffect, useMemo } from "react"
import { useParams } from "react-router-dom"
import { ThreeBodyLoader } from "@/components/ui/ThreeBodyLoader"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Pencil, Trash2, FileSpreadsheet, Archive, FileDown, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import * as XLSX from 'xlsx'
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface RekapData {
    id: number
    jenis_arsip: string
    waktu: string
    jumlah_berkas: number
    keterangan: string
    created_at: string
}

export default function RekapArsip() {
    const { category } = useParams<{ category: string }>()

    const categoryMap: Record<string, string> = {
        "kk": "Kartu Keluarga",
        "ktp": "KTP Elektronik",
        "akta-kelahiran": "Akta Kelahiran",
        "akta-kematian": "Akta Kematian",
        "akta-perkawinan": "Akta Perkawinan",
        "akta-perceraian": "Akta Perceraian",
        "sk-pindah": "Surat Pindah",
        "sk-datang": "Surat Datang"
    }

    const activeCategory = category ? categoryMap[category] : null

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [dataList, setDataList] = useState<RekapData[]>([])
    const [searchTerm, setSearchTerm] = useState("")

    // Pagination & Filter States
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [selectedYear, setSelectedYear] = useState<string>("ALL")
    const [selectedMonth, setSelectedMonth] = useState<string>("ALL") // New State
    const [importYear, setImportYear] = useState<string>(new Date().getFullYear().toString())

    const [showForm, setShowForm] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        jenis_arsip: "",
        waktu: "",
        jumlah_berkas: "",
        keterangan: ""
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setFetching(true)
        try {
            // Fetch ALL data (client-side filtering is smoother for < 10k rows)
            // Or we can filter by year in SQL if data is huge. For now client-side is flexible.
            const query = supabase
                .from('rekap_arsip')
                .select('*')
                .order('created_at', { ascending: false })

            const { data, error } = await query

            if (error) throw error
            setDataList(data || [])
        } catch (error: any) {
            console.error("Error fetching rekap:", error)
        } finally {
            setFetching(false)
        }
    }

    // Filter Logic (Search + Year + Month)
    const filteredData = useMemo(() => {
        return dataList.filter(item => {
            const matchesSearch =
                item.jenis_arsip.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.waktu.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.keterangan?.toLowerCase().includes(searchTerm.toLowerCase())

            // Filter Tahun: Cek apakah string 'waktu' mengandung tahun yang dipilih
            // Contoh waktu: "01 Jul 2023" -> includes "2023"
            const matchesYear = selectedYear === "ALL" || item.waktu.includes(selectedYear)

            // Filter Bulan (Fuzzy Match: "Mei" cocok dengan "01 Mei 2023")
            // Gunakan ID locale short names: Jan, Feb, Mar, Apr, Mei, Jun, Jul, Agu, Sep, Okt, Nov, Des
            const matchesMonth = selectedMonth === "ALL" || item.waktu.toLowerCase().includes(selectedMonth.toLowerCase())

            // Filter Kategori (URL Param)
            const matchesCategory = !activeCategory ||
                item.jenis_arsip.toLowerCase().includes(activeCategory.toLowerCase()) ||
                (category === 'kk' && item.jenis_arsip.toLowerCase().includes('kk')) || // Fallback "KK"
                (category === 'ktp' && item.jenis_arsip.toLowerCase().includes('ktp'))  // Fallback "KTP"

            return matchesSearch && matchesYear && matchesMonth && matchesCategory
        })
    }, [dataList, searchTerm, selectedYear, selectedMonth, activeCategory])

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, selectedYear, selectedMonth])


    const handleSubmit = async () => {
        if (!formData.jenis_arsip || !formData.waktu || !formData.jumlah_berkas) {
            toast.error("Mohon lengkapi Jenis Arsip, Waktu, dan Jumlah Berkas")
            return
        }

        setLoading(true)
        try {
            const payload = {
                jenis_arsip: formData.jenis_arsip,
                waktu: formData.waktu,
                jumlah_berkas: parseInt(formData.jumlah_berkas),
                keterangan: formData.keterangan || ""
            }

            if (editId) {
                const { error } = await supabase.from('rekap_arsip').update(payload).eq('id', editId)
                if (error) throw error
                toast.success("Data berhasil diperbarui")
            } else {
                const { error } = await supabase.from('rekap_arsip').insert(payload)
                if (error) throw error
                toast.success("Data berhasil disimpan")
            }

            setShowForm(false)
            resetForm()
            fetchData()
        } catch (error: any) {
            toast.error("Gagal menyimpan: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const confirmDelete = async () => {
        if (!deleteId) return
        try {
            const { error } = await supabase.from('rekap_arsip').delete().eq('id', deleteId)
            if (error) throw error
            toast.success("Data dihapus")
            fetchData()
        } catch (error: any) {
            toast.error("Gagal menghapus: " + error.message)
        } finally {
            setDeleteId(null)
        }
    }

    const resetForm = () => {
        setFormData({ jenis_arsip: "", waktu: "", jumlah_berkas: "", keterangan: "" })
        setEditId(null)
    }

    const handleEdit = (item: RekapData) => {
        setFormData({
            jenis_arsip: item.jenis_arsip,
            waktu: item.waktu,
            jumlah_berkas: item.jumlah_berkas.toString(),
            keterangan: item.keterangan || ""
        })
        setEditId(item.id)
        setShowForm(true)
    }

    // SMART EXCEL IMPORT (With Year Override)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]

                // 1. Cari Header
                let headerIndex = -1
                for (let i = 0; i < Math.min(20, rawRows.length); i++) {
                    const rowStr = JSON.stringify(rawRows[i]).toUpperCase()
                    if (rowStr.includes("JENIS ARSIP") || rowStr.includes("JUMLAH BERKAS")) {
                        headerIndex = i
                        break
                    }
                }

                if (headerIndex === -1) {
                    toast.error("Header tidak ditemukan (Cari: JENIS ARSIP / JUMLAH BERKAS)")
                    return
                }

                const headerRow = rawRows[headerIndex].map(h => String(h).trim().toUpperCase().replace(/[\r\n]+/g, " "))
                const idxJenis = headerRow.findIndex(h => h.includes("JENIS") && h.includes("ARSIP"))
                const idxWaktu = headerRow.findIndex(h => h.includes("WAKTU"))
                const idxJumlah = headerRow.findIndex(h => h.includes("JUMLAH"))
                const idxKet = headerRow.findIndex(h => h.includes("KETERANGAN"))

                if (idxJenis === -1 || idxJumlah === -1) {
                    toast.error("Kolom Wajib tidak lengkap")
                    return
                }

                // Helper Format Tanggal "01 Jul 2023" (Tahun Sesuai Pilihan)
                const formatWaktuWithYear = (serial: any, targetYear: string) => {
                    if (!serial) return ""

                    let day = "01"
                    let month = "Jan"

                    if (typeof serial === 'number') {
                        const date_info = new Date(Math.floor(serial - 25569) * 86400 * 1000)
                        day = date_info.getDate().toString().padStart(2, '0')
                        month = date_info.toLocaleString('id-ID', { month: 'short' })
                    } else if (typeof serial === 'string') {
                        // Coba ambil bagian depan string tanggal (misal "01-Jul")
                        const parts = serial.split(/[- ]/)
                        if (parts.length >= 2) {
                            day = parts[0].padStart(2, '0')
                            month = parts[1] // Harusnya nama bulan
                        }
                    }

                    return `${day} ${month} ${targetYear}`
                }

                const mappedData: any[] = []

                for (let i = headerIndex + 1; i < rawRows.length; i++) {
                    const row = rawRows[i]
                    if (!row || row.length === 0) continue

                    const jenisVal = row[idxJenis]
                    if (!jenisVal || String(jenisVal).toUpperCase().includes("JUMLAH")) continue

                    const jumlahParsed = parseInt(String(row[idxJumlah] || '0').replace(/[^0-9]/g, '')) || 0
                    if (jumlahParsed === 0 && !row[idxKet]) continue // Skip kalau jumlah 0 dan gak ada ket

                    mappedData.push({
                        jenis_arsip: String(jenisVal).trim().toUpperCase(),
                        waktu: idxWaktu !== -1 ? formatWaktuWithYear(row[idxWaktu], importYear) : `- ${importYear}`, // Pakai TAHUN dari Dropdown
                        jumlah_berkas: jumlahParsed,
                        keterangan: idxKet !== -1 ? String(row[idxKet] || "").trim() : ""
                    })
                }

                if (mappedData.length === 0) {
                    toast.error("Tidak ada data valid.")
                    return
                }

                setLoading(true)
                const { error } = await supabase.from('rekap_arsip').insert(mappedData)
                if (error) throw error

                toast.success(`Sukses import ${mappedData.length} data (Tahun ${importYear})`)
                fetchData()
            } catch (error: any) {
                console.error(error)
                toast.error("Error: " + error.message)
            } finally {
                setLoading(false)
                e.target.value = ''
            }
        }
        reader.readAsBinaryString(file)
    }

    const handleExportPDF = () => {
        const doc = new jsPDF()
        doc.text(`Laporan Rekap Arsip (${selectedMonth === 'ALL' ? '' : selectedMonth + ' '}${selectedYear === 'ALL' ? 'Semua Tahun' : selectedYear})`, 14, 15)
        doc.setFontSize(10)
        doc.text(`Total Arsip: ${filteredData.reduce((acc, curr) => acc + (curr.jumlah_berkas || 0), 0)} berkas`, 14, 22)

        const tableBody = filteredData.map((item, index) => [
            index + 1,
            item.jenis_arsip,
            item.waktu,
            item.jumlah_berkas,
            item.keterangan || '-'
        ])

        autoTable(doc, {
            head: [['No', 'Jenis Arsip', 'Waktu', 'Jml', 'Keterangan']],
            body: tableBody,
            startY: 25,
            theme: 'grid',
        })
        doc.save(`Rekap_Arsip_${selectedMonth}_${selectedYear}.pdf`)
    }

    // Generate Array Tahun (2002 - Now + 1)
    const currentYear = new Date().getFullYear()
    const startYear = 2002
    const years = Array.from({ length: currentYear - startYear + 2 }, (_, i) => (startYear + i).toString()).reverse()

    const months = [
        { value: "Jan", label: "Januari" },
        { value: "Feb", label: "Februari" },
        { value: "Mar", label: "Maret" },
        { value: "Apr", label: "April" },
        { value: "Mei", label: "Mei" },
        { value: "Jun", label: "Juni" },
        { value: "Jul", label: "Juli" },
        { value: "Agu", label: "Agustus" },
        { value: "Sep", label: "September" },
        { value: "Okt", label: "Oktober" },
        { value: "Nov", label: "November" },
        { value: "Des", label: "Desember" }
    ]

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Archive className="h-8 w-8 text-indigo-600" />
                        Rekap Jumlah Arsip {activeCategory && `- ${activeCategory}`}
                    </h1>
                    <p className="text-muted-foreground">Manajemen data rekapitulasi arsip fisik {activeCategory?.toLowerCase()}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Unique Import Group */}
                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
                        <div className="flex flex-col gap-0.5 px-1">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tahun Data</span>
                            <Select value={importYear} onValueChange={setImportYear}>
                                <SelectTrigger className="h-7 w-[80px] border-none bg-slate-100 focus:ring-0 text-sm p-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="h-8 w-[1px] bg-slate-200"></div>

                        <div className="relative">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <Button size="sm" variant="outline" className="h-9 gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200 font-medium">
                                <FileSpreadsheet className="h-4 w-4" />
                                Import Excel
                            </Button>
                        </div>
                    </div>

                    <div className="h-8 w-[1px] bg-slate-200 hidden md:block mx-1"></div>

                    <Button size="sm" variant="outline" onClick={handleExportPDF} className="h-12 px-4 border-red-200 text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800 font-medium gap-2">
                        <FileDown className="h-4 w-4" />
                        Export PDF
                    </Button>

                    <Button size="sm" onClick={() => {
                        resetForm();
                        if (activeCategory) setFormData(prev => ({ ...prev, jenis_arsip: activeCategory }));
                        setShowForm(true);
                    }} className="h-12 px-4 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm">
                        <Plus className="h-4 w-4" />
                        Tambah Data
                    </Button>
                </div>
            </div>

            <Card className="border-indigo-100 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-slate-50 border rounded-md px-3 py-1">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-slate-600">Filter:</span>

                                {/* Filter Bulan */}
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="h-8 w-[110px] border-none bg-transparent focus:ring-0 shadow-none">
                                        <SelectValue placeholder="Bulan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Bulan</SelectItem>
                                        {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>

                                <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>

                                {/* Filter Tahun */}
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="h-8 w-[90px] border-none bg-transparent focus:ring-0 shadow-none">
                                        <SelectValue placeholder="Tahun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Thn</SelectItem>
                                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari arsip..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[50px] text-center">No</TableHead>
                                    <TableHead>Jenis Arsip</TableHead>
                                    <TableHead>Waktu</TableHead>
                                    <TableHead className="text-center">Jumlah</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fetching ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4 py-8">
                                                <ThreeBodyLoader size={45} color="#4F46E5" />
                                                <p className="text-sm font-medium text-indigo-600/80 animate-pulse">
                                                    Memuat data Rekap Arsip...
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                            Tidak ada data ditemukan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((item, i) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50/50">
                                            <TableCell className="text-center text-muted-foreground">
                                                {(currentPage - 1) * itemsPerPage + i + 1}
                                            </TableCell>
                                            <TableCell className="font-medium text-indigo-900">{item.jenis_arsip}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                    ${item.waktu.includes("2024") ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                                                    {item.waktu}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-slate-700">{item.jumlah_berkas}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm italic">{item.keterangan || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)} className="h-8 w-8 text-red-600 hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Halaman {currentPage} dari {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                </CardContent>
                <CardFooter className="bg-slate-50 border-t flex justify-between items-center py-4">
                    <div className="text-sm text-muted-foreground">
                        Total Arsip ({selectedYear === 'ALL' ? 'Semua' : selectedYear})
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-indigo-700">
                            {filteredData.reduce((acc, curr) => acc + (curr.jumlah_berkas || 0), 0).toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground mb-1">berkas</span>
                    </div>
                </CardFooter>
            </Card>

            {/* Form Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editId ? "Edit Arsip" : "Tambah Arsip Baru"}</DialogTitle>
                        <DialogDescription>Masukkan detail rekapitulasi arsip fisik.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Jenis Arsip</Label>
                            <Input
                                placeholder="Contoh: AKTA KELAHIRAN LU"
                                value={formData.jenis_arsip}
                                onChange={e => !activeCategory && setFormData({ ...formData, jenis_arsip: e.target.value.toUpperCase() })}
                                disabled={!!activeCategory}
                                className={activeCategory ? "bg-slate-100 text-slate-500 font-medium" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Waktu (Batch)</Label>
                            <Input
                                placeholder="Contoh: 01 Jan 2024"
                                value={formData.waktu}
                                onChange={e => setFormData({ ...formData, waktu: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Jumlah Berkas</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={formData.jumlah_berkas}
                                onChange={e => setFormData({ ...formData, jumlah_berkas: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Keterangan (Opsional)</Label>
                            <Input
                                placeholder="Catatan tambahan..."
                                value={formData.keterangan}
                                onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
                        <Button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                            {loading ? "Menyimpan..." : "Simpan Data"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Data Arsip?</AlertDialogTitle>
                        <AlertDialogDescription>Data ini akan dihapus permanen.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700">Ya, Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
