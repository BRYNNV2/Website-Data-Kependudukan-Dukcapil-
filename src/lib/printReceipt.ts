import logoDinas from "@/assets/logo.png"

export interface PrintData {
    title: string
    documentNo: string
    data: Record<string, string | number | null | undefined>
    petugas?: string
    tanggal?: string
}

export const printReceipt = (info: PrintData) => {
    // Gunakan URL absolut untuk logo agar bisa dirender di window/iframe baru
    const logoUrl = window.location.origin + logoDinas;

    // Filter value null/undefined
    const cleanData = Object.entries(info.data).reduce((acc, [key, value]) => {
        acc[key] = value ?? "-";
        return acc;
    }, {} as Record<string, any>);

    const tanggalCetak = info.tanggal || new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>Tanda Terima - ${info.documentNo}</title>
            <style>
                @page { size: A4 portrait; margin: 20mm; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    color: #000;
                    margin: 0;
                    padding: 0;
                    font-size: 14pt; /* Diperbesar dari 11pt */
                }
                .container {
                    border: 2px solid #333;
                    padding: 30px; /* Ditambah */
                    border-radius: 8px;
                    position: relative;
                    min-height: 80vh; /* Agar mengisi ruang lebih baik */
                }
                /* Watermark Kop */
                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    opacity: 0.04;
                    width: 500px; /* Diperbesar */
                    z-index: -1;
                }
                .kop {
                    display: flex;
                    align-items: center;
                    border-bottom: 4px double #000; /* Ditebalkan */
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .kop img {
                    width: 90px; /* Diperbesar */
                    height: auto;
                    margin-right: 25px;
                }
                .kop-text {
                    flex-grow: 1;
                    text-align: center;
                }
                .kop-text h2 { 
                    font-size: 16pt; /* Diperbesar */
                    text-transform: uppercase; 
                    margin: 0; 
                    font-weight: normal;
                }
                .kop-text h1 { 
                    font-size: 20pt; /* Diperbesar */
                    font-weight: bold; 
                    text-transform: uppercase; 
                    letter-spacing: 1px;
                    margin: 5px 0;
                }
                .kop-text p { 
                    font-size: 11pt; /* Diperbesar */
                    margin: 0;
                }
                
                .title-area {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .title-area h3 {
                    margin: 0;
                    text-decoration: underline;
                    font-size: 16pt; /* Diperbesar */
                }
                .title-area p {
                    margin: 8px 0 0 0;
                    font-weight: bold;
                    font-family: monospace;
                    font-size: 14pt; /* Diperbesar */
                }
                
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 40px;
                    line-height: 1.6; /* Lebih renggang */
                }
                .data-table th, .data-table td {
                    padding: 8px 4px;
                    text-align: left;
                    vertical-align: top;
                }
                .data-table th {
                    width: 35%;
                    font-weight: normal;
                }
                .data-table td.colon {
                    width: 3%;
                    text-align: center;
                }
                .data-table td.value {
                    font-weight: bold;
                    border-bottom: 1px dotted #ccc;
                }
                
                .footer {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 50px;
                }
                .signature {
                    text-align: center;
                    width: 250px;
                    font-size: 12pt; /* Diperbesar */
                }
                .signature p {
                    margin: 2px 0;
                }
                .signature p.name {
                    margin-top: 80px; /* Jarak ttd lebih luas */
                    font-weight: bold;
                    text-decoration: underline;
                }
                .notes {
                    font-size: 11pt; /* Diperbesar */
                    color: #555;
                    margin-top: 50px; /* Jarak dari tanda tangan */
                    border-top: 1px dashed #ccc;
                    padding-top: 15px;
                    text-align: justify;
                }
                
                @media print {
                    button { display: none; }
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <img src="${logoUrl}" class="watermark" alt="Watermark" />
                <div class="kop">
                    <img src="${logoUrl}" alt="Logo Tanjungpinang" />
                    <div class="kop-text">
                        <h2>PEMERINTAH KOTA TANJUNGPINANG</h2>
                        <h1>DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL</h1>
                        <p>Jalan Senggarang No.1, Tanjungpinang, Kepulauan Riau 29115</p>
                    </div>
                </div>
                
                <div class="title-area">
                    <h3>${info.title}</h3>
                    <p>No. Registrasi / NIK : ${info.documentNo}</p>
                </div>
                
                <table class="data-table">
                    <tbody>
                        ${Object.entries(cleanData).map(([key, val]) => `
                        <tr>
                            <th>${key}</th>
                            <td class="colon">:</td>
                            <td class="value">${val}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    <div class="signature left">
                        <p>Pemohon / Pemilik Data,</p>
                        <p class="name">( ........................................ )</p>
                    </div>
                    <div class="signature right">
                        <p>Tanjungpinang, ${tanggalCetak}</p>
                        <p>Petugas Registrasi / Verifikator,</p>
                        <p class="name">${info.petugas || 'Admin SI-PENDUDUK'}</p>
                    </div>
                </div>
                
                <div class="notes">
                    <p><strong>Catatan Penting:</strong> Tanda terima ini dicetak secara otomatis dari Sistem Informasi Kependudukan Dinas Dukcapil Tanjungpinang. Harap simpan tanda terima ini sebagai bukti registrasi yang sah. Dokumen ini menyatakan bahwa data yang tercantum telah terverifikasi dan masuk ke dalam database kependudukan digital.</p>
                </div>
            </div>
            
            <script>
                // Tunggu gambar logo terload sebelum mencetak
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        // Optional: tutup jendela setelah print (sebagian browser mungkin nge-block ini)
                        window.onafterprint = function() { window.close(); }
                    }, 500);
                }
            </script>
        </body>
        </html>
    `;

    // Opens a popup window
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    } else {
        // Fallback jika popup blocker aktif
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentDocument?.write(htmlContent);
        iframe.contentDocument?.close();

        // Timeout manual karena window.onload di dalam iframe kadang berbeda perilakunya
        setTimeout(() => {
            iframe.contentWindow?.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 1000);
    }
}
