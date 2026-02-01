import { useState, useEffect, useRef } from 'react';
import { Bell, FileWarning, CheckCircle, Info, X } from 'lucide-react';
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

    const dismissNotification = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const dismissedIds = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
        if (!dismissedIds.includes(id)) {
            const updatedDismissedIds = [...dismissedIds, id];
            localStorage.setItem('dismissed_notifications', JSON.stringify(updatedDismissedIds));
            setNotifications(prev => prev.filter(n => n.id !== id));
            // Recalculate unread count
            setUnreadCount(prev => Math.max(0, prev - (notifications.find(n => n.id === id)?.read ? 0 : 1)));
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            // Fetch all data in parallel for better performance
            const [
                { data: missingKTP },
                { data: missingKK },
                { data: recentKTP },
                { data: recentKK },
                { data: recentAktaLahir },
                { data: recentAktaKematian },
                { data: recentAktaPerkawinan },
                { data: recentAktaPerceraian }
            ] = await Promise.all([
                // 1. Alert: Missing KTP Docs
                supabase
                    .from('penduduk')
                    .select('nik, nama_lengkap, created_at')
                    .is('foto_dokumen', null)
                    .order('created_at', { ascending: false })
                    .limit(2),

                // 2. Alert: Missing KK Docs
                supabase
                    .from('kartu_keluarga')
                    .select('no_kk, kepala_keluarga, created_at')
                    .is('foto_dokumen', null)
                    .order('created_at', { ascending: false })
                    .limit(2),

                // 3. Info: Recent KTP
                supabase
                    .from('penduduk')
                    .select('nama_lengkap, created_at')
                    .order('created_at', { ascending: false })
                    .limit(2),

                // 4. Info: Recent KK
                supabase
                    .from('kartu_keluarga')
                    .select('kepala_keluarga, created_at')
                    .order('created_at', { ascending: false })
                    .limit(2),

                // 5. Info: Recent Akta Lahir
                supabase
                    .from('akta_kelahiran')
                    .select('nama_anak, created_at')
                    .order('created_at', { ascending: false })
                    .limit(2),

                // 6. Info: Recent Akta Kematian
                supabase
                    .from('akta_kematian')
                    .select('nama, created_at')
                    .order('created_at', { ascending: false })
                    .limit(2),

                // 7. Info: Recent Akta Perkawinan
                supabase
                    .from('akta_perkawinan')
                    .select('no_akta, nama_suami, nama_istri, created_at')
                    .order('created_at', { ascending: false })
                    .limit(2),

                // 8. Info: Recent Akta Perceraian
                supabase
                    .from('akta_perceraian')
                    .select('no_akta, nama_suami, nama_istri, created_at')
                    .order('created_at', { ascending: false })
                    .limit(2)
            ]);

            const newNotifications: NotificationItem[] = [];
            const dismissedIds = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');

            const getReadStatus = (id: string) => {
                const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
                return readIds.includes(id);
            };

            const isDismissed = (id: string) => dismissedIds.includes(id);

            // Helper to add if not dismissed
            const addNotif = (notif: NotificationItem) => {
                if (!isDismissed(notif.id)) {
                    newNotifications.push(notif);
                }
            };

            missingKTP?.forEach(item => {
                const notifId = `ktp-missing-${item.nik}`;
                addNotif({
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
                addNotif({
                    id: notifId,
                    type: 'alert',
                    title: 'Dokumen KK Belum Lengkap',
                    message: `KK a.n. ${item.kepala_keluarga} belum diunggah.`,
                    timestamp: item.created_at,
                    read: getReadStatus(notifId)
                });
            });

            recentKTP?.forEach(item => {
                const notifId = `ktp-new-${item.nama_lengkap}-${item.created_at}`;
                addNotif({
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
                addNotif({
                    id: notifId,
                    type: 'success',
                    title: 'Input KK Baru',
                    message: `Data KK Keluarga ${item.kepala_keluarga} berhasil ditambahkan.`,
                    timestamp: item.created_at,
                    read: getReadStatus(notifId)
                });
            });

            recentAktaLahir?.forEach(item => {
                const notifId = `akta-lahir-new-${item.nama_anak}-${item.created_at}`;
                addNotif({
                    id: notifId,
                    type: 'info',
                    title: 'Input Akta Kelahiran',
                    message: `Akta Kelahiran a.n. ${item.nama_anak} diterbitkan.`,
                    timestamp: item.created_at,
                    read: getReadStatus(notifId)
                });
            });

            recentAktaKematian?.forEach(item => {
                const notifId = `akta-mati-new-${item.nama}-${item.created_at}`;
                addNotif({
                    id: notifId,
                    type: 'info',
                    title: 'Input Akta Kematian',
                    message: `Akta Kematian a.n. ${item.nama} ditambahkan.`,
                    timestamp: item.created_at,
                    read: getReadStatus(notifId)
                });
            });

            recentAktaPerkawinan?.forEach(item => {
                const notifId = `akta-kawin-new-${item.no_akta}-${item.created_at}`;
                addNotif({
                    id: notifId,
                    type: 'info',
                    title: 'Input Akta Perkawinan',
                    message: `Akta Perkawinan No. ${item.no_akta} ditambahkan.`,
                    timestamp: item.created_at,
                    read: getReadStatus(notifId)
                });
            });

            recentAktaPerceraian?.forEach(item => {
                const notifId = `akta-cerai-new-${item.no_akta}-${item.created_at}`;
                addNotif({
                    id: notifId,
                    type: 'info',
                    title: 'Input Akta Perceraian',
                    message: `Akta Perceraian No. ${item.no_akta} ditambahkan.`,
                    timestamp: item.created_at,
                    read: getReadStatus(notifId)
                });
            });

            newNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            setNotifications(newNotifications);
            setUnreadCount(newNotifications.filter(n => !n.read).length);

        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleRefresh = () => {
            console.log("Manual notification refresh triggered")
            fetchNotifications()
        }
        window.addEventListener('trigger-notification-refresh', handleRefresh)
        return () => window.removeEventListener('trigger-notification-refresh', handleRefresh)
    }, [])

    useEffect(() => {
        fetchNotifications();
        const channel = supabase
            .channel('realtime-notifications')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'penduduk' }, fetchNotifications)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kartu_keluarga' }, fetchNotifications)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'akta_kelahiran' }, fetchNotifications)
            .subscribe()
        return () => { supabase.removeChannel(channel) }
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
                            <div className="p-8 text-center text-gray-500 text-sm">Memuat notifikasi...</div>
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
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-medium text-gray-900 leading-tight">
                                                    {notification.title}
                                                </p>
                                                <button
                                                    onClick={(e) => dismissNotification(e, notification.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 -mt-1 -mr-1"
                                                    title="Hapus notifikasi"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
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
                </div>
            )}
        </div>
    );
};
