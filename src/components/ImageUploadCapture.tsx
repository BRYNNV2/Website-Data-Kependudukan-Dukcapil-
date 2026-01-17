import { useState, useRef, useCallback } from "react"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Upload, X, RefreshCw } from "lucide-react"

interface ImageUploadCaptureProps {
    onImageCaptured: (file: File) => void
    label?: string
    currentImage?: string | null
}

export function ImageUploadCapture({ onImageCaptured, label = "Bukti Foto", currentImage }: ImageUploadCaptureProps) {
    const [preview, setPreview] = useState<string | null>(currentImage || null)
    const [isOpen, setIsOpen] = useState(false)
    const webcamRef = useRef<Webcam>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Handle file upload
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
            onImageCaptured(file)
            setIsOpen(false)
        }
    }

    // Handle webcam capture
    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot()
        if (imageSrc) {
            setPreview(imageSrc)
            // Convert base64 to file
            fetch(imageSrc)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" })
                    onImageCaptured(file)
                })
            setIsOpen(false)
        }
    }, [webcamRef, onImageCaptured])

    // Clear image
    const clearImage = (e: React.MouseEvent) => {
        e.stopPropagation()
        setPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    return (
        <div className="space-y-2">
            <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</span>

            {!preview ? (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors h-40">
                            <Camera className="h-8 w-8 text-gray-400" />
                            <span className="text-sm text-gray-500 font-medium">Klik untuk Upload / Foto</span>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Upload Bukti Foto</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="camera" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="camera">Kamera</TabsTrigger>
                                <TabsTrigger value="upload">Upload File</TabsTrigger>
                            </TabsList>
                            <TabsContent value="camera" className="space-y-4 py-4">
                                <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="w-full h-full object-cover"
                                        videoConstraints={{ facingMode: "user" }} // Default to user (selfie) or environment
                                    />
                                </div>
                                <Button onClick={capture} className="w-full">
                                    <Camera className="mr-2 h-4 w-4" />
                                    Ambil Foto
                                </Button>
                            </TabsContent>
                            <TabsContent value="upload" className="space-y-4 py-4">
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-gray-50"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-10 w-10 text-gray-400" />
                                    <div className="text-center">
                                        <p className="text-sm font-medium">Klik untuk pilih file</p>
                                        <p className="text-xs text-muted-foreground">JPG, PNG, max 5MB</p>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            ) : (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 w-full h-48 bg-gray-100 group">
                    <img src={preview} alt="Bukti" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Ganti
                        </Button>
                        <Button variant="destructive" size="sm" onClick={clearImage}>
                            <X className="h-4 w-4 mr-2" />
                            Hapus
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
