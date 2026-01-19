import { AktaPerceraianForm } from "@/components/forms/AktaPerceraianForm"

export default function InputAktaPerceraian() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Input Data Akta Perceraian</h1>
                <p className="text-muted-foreground">Formulir input untuk data akta perceraian penduduk.</p>
            </div>
            <AktaPerceraianForm />
        </div>
    )
}
