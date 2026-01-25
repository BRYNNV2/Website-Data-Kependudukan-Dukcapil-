import { useState, useEffect, useRef } from 'react';
import { Bell, FileWarning, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface NotificationItem {
    id: string;
    type: 'alert' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: string; // ISO string
    read: boolean;
}

export const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            // 1. Fetch missing documents (Alerts)
            // Limit to top 2 most recent missing docs per category to avoid clutter
            const { data: missingKTP } = await supabase
                .from('penduduk')
                .select('nik, nama_lengkap, created_at')
                .is('foto_dokumen', null)
                .order('created_at', { ascending: false })
                .limit(2);

            const { data: missingKK } = await supabase
                .from('kartu_keluarga')
                .select('no_kk, kepala_keluarga, created_at')
                .is('foto_dokumen', null)
                .order('created_at', { ascending: false })
                .limit(2);


            // 2. Fetch Recent Activities (Info)
            const { data: recentKTP } = await supabase
                .from('penduduk')
                .select('nama_lengkap, created_at')
                .order('created_at', { ascending: false })
                .limit(2);

            const { data: recentKK } = await supabase
                .from('kartu_keluarga')
                .select('kepala_keluarga, created_at')
                .order('created_at', { ascending: false })
                .limit(2);

            const { data: recentAktaLahir } = await supabase
                .from('akta_kelahiran')
                .select('nama, created_at')
                .order('created_at', { ascending: false })
                .limit(2);


            const newNotifications: NotificationItem[] = [];

            // Helper to check read status from local storage
            const getReadStatus = (id: string) => {
                const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
                return readIds.includes(id);
            };

            // Process Alerts
            missingKTP?.forEach(item => {
                const notifId = `ktp-missing-${item.nik}`;
                newNotifications.push({
                    id: notifId,
                    type: 'alert',
                    title: 'Dokumen KTP Belum Lengkap',
                    message: `KTP a.n. ${item.nama_lengkap} belum memiliki lampiran foto.`,
                    timestamp: item.created_at,
                    read: getReadStatus(notifId)
                });
            });

            missingKK?.forEach(item => {
                const notifId = `kk-missing-${item.no_kk}`;
                newNotifications.push({
                    id: notifId,
                    type: 'alert',
                    title: 'Dokumen KK Belum Lengkap',
                    message: `KK a.n. ${item.kepala_keluarga} belum diunggah.`,
                    timestamp: item.created_at,
                    read: getReadStatus(notifId)
                });
            });

            // Process Recent Activity
            recentKTP?.forEach(item => {
                const notifId = `ktp-new-${item.nama_lengkap}-${item.created_at}`;
                newNotifications.push({
                    id: notifId,
                    type: 'success',
                    title: 'Input KTP Baru',
                    message: `Data KTP a.n. ${item.nama_lengkap} berhasil ditambahkan.`,
                    timestamp: item.created_at,
                    read: getReadStatus(notifId)
                });
            });

            recentKK?.forEach(item => {
                const notifId = `kk-new-${item.kepala_keluarga}-${item.created_at}`;
                newNotifications.push({
                    id: notifId,
                    type: 'success',
                    title: 'Input KK Baru',
                    message: `Data KK Keluarga ${item.kepala_keluarga} berhasil ditambahkan.`,
                    timestamp: item.created_at,
                    read: getReadStatus(notifId)
                });
            });

            recentAktaLahir?.forEach(item => {
                const notifId = `akta-lahir-new-${item.nama}-${item.created_at}`;
                newNotifications.push({
                    id: notifId,
                    type: 'info',
                    title: 'Input Akta Kelahiran',
                    message: `Akta Kelahiran a.n. ${item.nama} diterbitkan.`,
                    timestamp: item.created_at,
                    read: getReadStatus(notifId)
                });
            });

            // Sort by date desc
            newNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            setNotifications(newNotifications);
            setUnreadCount(newNotifications.filter(n => !n.read).length);

        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount and when opening
    useEffect(() => {
        fetchNotifications();
    }, []);


    const toggleDropdown = () => setIsOpen(!isOpen);

    const markAllRead = () => {
        const allIds = notifications.map(n => n.id);
        const existingReadIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        const updatedReadIds = Array.from(new Set([...existingReadIds, ...allIds]));

        localStorage.setItem('read_notifications', JSON.stringify(updatedReadIds));

        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-indigo-600 relative"
                onClick={toggleDropdown}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 backdrop-blur-sm">
                        <div>
                            <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                            <p className="text-xs text-muted-foreground">Anda memiliki {unreadCount} notifikasi baru.</p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                            >
                                Tandai sudah dibaca
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                Memuat notifikasi...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                                <Bell className="h-8 w-8 text-gray-300" />
                                <span className="text-sm">Tidak ada notifikasi saat ini.</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors flex gap-3 items-start ${!notification.read ? 'bg-indigo-50/30' : ''}`}
                                    >
                                        <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 
                                            ${notification.type === 'alert' ? 'bg-red-100 text-red-600' :
                                                notification.type === 'success' ? 'bg-green-100 text-green-600' :
                                                    'bg-blue-100 text-blue-600'}`}>
                                            {notification.type === 'alert' ? <FileWarning className="h-4 w-4" /> :
                                                notification.type === 'success' ? <CheckCircle className="h-4 w-4" /> :
                                                    <Info className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium text-gray-900 leading-tight">
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-gray-600 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: id })}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="h-2 w-2 rounded-full bg-indigo-500 mt-2"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
                        <button className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                            Lihat Semua Aktivitas
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
