
// Vercel Edge Middleware (Standard Web API)
// No external dependencies required!

export const config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};

export default function middleware(request: Request) {
    // 1. Ambil Variabel Lingkungan (Environment Variables)
    // Di Vercel Edge, process.env tersedia secara global
    const isRestrictionActive = process.env.IS_IP_RESTRICTION_ACTIVE === 'true';

    // Jika fitur dinonaktifkan, izinkan semua request
    if (!isRestrictionActive) {
        return; // 'return' tanpa nilai berarti lanjut ke halaman berikutnya (next())
    }

    // 2. Deteksi IP Pengunjung
    // Header 'x-forwarded-for' adalah standar de-facto untuk melihat IP asli di balik proxy Vercel
    const forwardedFor = request.headers.get('x-forwarded-for');
    let ip = forwardedFor ? forwardedFor.split(',')[0].trim() : null;

    // Fallback: Jika testing lokal, mungkin tidak ada header x-forwarded-for
    if (!ip) {
        ip = '127.0.0.1';
    }

    // 3. Ambil Daftar IP yang Diizinkan
    const allowedIpsString = process.env.ALLOWED_IPS || '';
    const allowedIps = allowedIpsString.split(',').map((i) => i.trim()).filter(Boolean);

    // Selalu izinkan localhost
    allowedIps.push('127.0.0.1', '::1');

    // 4. Cek Validitas IP
    if (allowedIps.includes(ip)) {
        return; // Izinkan akses
    }

    // 5. Blokir Akses (403 Forbidden)
    return new Response(JSON.stringify({
        error: 'Access Denied',
        message: 'Your IP is not authorized to access this system.',
        your_ip: ip
    }), {
        status: 403,
        headers: {
            'content-type': 'application/json',
        },
    });
}
