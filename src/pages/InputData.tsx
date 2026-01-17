import Layout from "@/components/Layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KKForm } from "@/components/forms/KKForm"
import { KTPForm } from "@/components/forms/KTPForm"
import { AktaForm } from "@/components/forms/AktaForm"

export default function InputData() {
    return (
        <Layout>
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight text-gray-800">Input Data Kependudukan</h2>
                <p className="text-muted-foreground mt-1">Pilih jenis dokumen kependudukan yang ingin diproses.</p>
            </div>

            <Tabs defaultValue="ktp" className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-3 max-w-[500px] bg-muted/50 p-1">
                    <TabsTrigger value="kk" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Kartu Keluarga</TabsTrigger>
                    <TabsTrigger value="ktp" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">KTP Elektronik</TabsTrigger>
                    <TabsTrigger value="akta" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Akta Kelahiran</TabsTrigger>
                </TabsList>

                <TabsContent value="kk" className="animate-in fade-in-50 slide-in-from-left-2 duration-300">
                    <div className="max-w-2xl">
                        <KKForm />
                    </div>
                </TabsContent>
                <TabsContent value="ktp" className="animate-in fade-in-50 slide-in-from-left-2 duration-300">
                    <div className="max-w-2xl">
                        <KTPForm />
                    </div>
                </TabsContent>
                <TabsContent value="akta" className="animate-in fade-in-50 slide-in-from-left-2 duration-300">
                    <div className="max-w-2xl">
                        <AktaForm />
                    </div>
                </TabsContent>
            </Tabs>
        </Layout>
    )
}
