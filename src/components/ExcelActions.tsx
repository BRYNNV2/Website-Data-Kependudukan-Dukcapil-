import { Button } from "@/components/ui/button"
import { FileDown, FileUp } from "lucide-react"
import * as XLSX from "xlsx"
import { toast } from "sonner"

export interface ColumnMapItem {
    key: string        // nama field di database
    label: string      // nama kolom di Excel
    format?: (value: any) => string  // fungsi format opsional
}

interface ExcelActionsProps {
    data: any[]
    fileName: string
    onImport: (data: any[]) => Promise<void>
    isLoading?: boolean
    /** Opsional: Fetch SEMUA data sebelum export (menghindari export hanya halaman aktif) */
    onFetchAllForExport?: () => Promise<any[]>
    /** Opsional: Definisi kolom yang ingin ditampilkan & nama headernya */
    columnMap?: ColumnMapItem[]
}

const applyExcelStyles = (ws: XLSX.WorkSheet, headers: string[]) => {
    // Atur lebar kolom otomatis berdasarkan panjang header
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 5, 18) }))

    // Freeze baris pertama (header)
    ws['!freeze'] = { xSplit: 0, ySplit: 1 }
}

export function ExcelActions({ data, fileName, onImport, isLoading, onFetchAllForExport, columnMap }: ExcelActionsProps) {

    const transformDataWithColumnMap = (rawData: any[]): any[] => {
        if (!columnMap || columnMap.length === 0) {
            // Fallback: hapus kolom internal saja
            const HIDDEN = ["id", "is_deleted", "created_at", "updated_at", "foto_dokumen", "foto_url", "tipe_akta"]
            return rawData.map(item => {
                const cleaned: any = {}
                Object.keys(item).filter(k => !HIDDEN.includes(k)).forEach(k => {
                    cleaned[k] = item[k]
                })
                return cleaned
            })
        }

        return rawData.map(item => {
            const row: any = {}
            columnMap.forEach(col => {
                const rawValue = item[col.key]
                row[col.label] = col.format ? col.format(rawValue) : (rawValue ?? "-")
            })
            return row
        })
    }

    const handleExport = async () => {
        try {
            let exportData = data

            if (onFetchAllForExport) {
                toast.info("Menyiapkan data untuk export Excel...")
                exportData = await onFetchAllForExport()
            }

            if (!exportData || exportData.length === 0) {
                toast.error("Tidak ada data untuk diexport")
                return
            }

            const transformedData = transformDataWithColumnMap(exportData)
            const headers = Object.keys(transformedData[0] || {})

            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(transformedData)

            applyExcelStyles(ws, headers)

            // Proteksi sheet (bisa dilihat tapi tidak langsung diedit)
            ws['!protect'] = {
                sheet: true,
                formatCells: true,
                formatColumns: true,
                formatRows: true,
                sort: true,
                autoFilter: true,
                selectLockedCells: true,
                selectUnlockedCells: true,
            } as any

            XLSX.utils.book_append_sheet(wb, ws, "Data")
            XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`)
            toast.success(`Export Excel berhasil! Total ${transformedData.length} data.`)
        } catch (error: any) {
            console.error("Export Excel error:", error)
            toast.error("Gagal export Excel: " + error.message)
        }
    }

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: "binary" })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const jsonData = XLSX.utils.sheet_to_json(ws)

                if (jsonData.length === 0) {
                    toast.error("File Excel kosong")
                    return
                }

                await onImport(jsonData)
            } catch (error: any) {
                console.error("Import error:", error)
                toast.error("Gagal import: " + error.message)
            }
        }
        reader.readAsBinaryString(file)
        e.target.value = ""
    }

    return (
        <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 hover:border-green-300">
                <FileDown className="h-4 w-4 mr-2" />
                Export Excel
            </Button>
            <div className="relative inline-block">
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleImport}
                    disabled={isLoading}
                />
                <Button variant="outline" size="sm" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 hover:border-blue-300" disabled={isLoading}>
                    <FileUp className="h-4 w-4 mr-2" />
                    {isLoading ? "Importing..." : "Import Excel"}
                </Button>
            </div>
        </div>
    )
}
