import { AktaPerkawinanForm } from "@/components/forms/AktaPerkawinanForm"

export default function InputAktaPerkawinan() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Input Data Akta Perkawinan</h1>
                <p className="text-muted-foreground">
                    Formulir pencatatan data perkawinan penduduk.
                </p>
            </div>

            <AktaPerkawinanForm />
        </div>
    )
}
