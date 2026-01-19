import { AktaKematianForm } from "@/components/forms/AktaKematianForm"

export default function InputAktaKematian() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Input Data Akta Kematian</h1>
                <p className="text-muted-foreground">Formulir input untuk data akta kematian penduduk.</p>
            </div>
            <AktaKematianForm />
        </div>
    )
}
