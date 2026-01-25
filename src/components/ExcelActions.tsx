import { Button } from "@/components/ui/button"
import { FileDown, FileUp } from "lucide-react"
import * as XLSX from "xlsx"
import { toast } from "sonner"

interface ExcelActionsProps {
    data: any[]
    fileName: string
    onImport: (data: any[]) => Promise<void>
    isLoading?: boolean
}

export function ExcelActions({ data, fileName, onImport, isLoading }: ExcelActionsProps) {
    const handleExport = () => {
        if (!data || data.length === 0) {
            toast.error("Tidak ada data untuk diexport")
            return
        }

        // Remove internal fields if necessary, or just dump all
        // Usually cleaner to map specific fields, but for generic dump:
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(data)
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
        XLSX.writeFile(wb, `${fileName}.xlsx`)
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
        e.target.value = "" // Reset input
    }

    return (
        <div className="flex gap-2">
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
