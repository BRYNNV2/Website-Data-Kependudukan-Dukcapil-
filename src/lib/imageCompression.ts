import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

/**
 * Mengompres gambar dengan settingan optimal untuk dokumen kependudukan.
 * Target: Ukuran file di bawah 500KB dengan resolusi maksimal 1920px.
 */
export const compressImage = async (file: File): Promise<File> => {
    // Settingan kompresi
    const options = {
        maxSizeMB: 0.5,           // Maksimal 0.5 MB (500 KB) agar irit storage
        maxWidthOrHeight: 1920,   // Resolusi cukup Full HD, teks tetap terbaca
        useWebWorker: true,       // Proses di background biar UI tidak lag
        fileType: 'image/jpeg'    // Convert ke JPEG agar kompatibel
    };

    try {
        // Cek ukuran awal dulu, kalau sudah kecil (< 500KB) gausah dikompres biar cepet
        if (file.size / 1024 / 1024 < 0.5) {
            return file;
        }

        const compressedFile = await imageCompression(file, options);

        // Log untuk debug (bisa dihapus nanti)
        // console.log(`Original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        // console.log(`Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

        return compressedFile;
    } catch (error) {
        console.error("Gagal melakukan kompresi gambar:", error);
        toast.error("Gagal memperkecil ukuran gambar. Menggunakan file asli.");
        return file; // Kembalikan file asli jika gagal (fallback)
    }
};
