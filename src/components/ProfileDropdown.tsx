import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import AvatarEditor from 'react-avatar-editor'

interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
}

export const ProfileDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [formData, setFormData] = useState({ full_name: '' });

    // Image Upload State
    const [image, setImage] = useState<File | null>(null);
    const [editor, setEditor] = useState<AvatarEditor | null>(null);
    const [scale, setScale] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const navigate = useNavigate();

    useEffect(() => {
        getProfile();

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Check if we have public profile data in a table or just metadata
            // For now, assuming metadata or basic auth user object + local storage for persistence if needed
            // But valid app usually has a 'profiles' table. 
            // IMPORTANT: We will use user_metadata first as it's easiest for "full_name"

            setUser({
                id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name || 'Admin Petugas',
                avatar_url: user.user_metadata?.avatar_url || null
            });
            setFormData({ full_name: user.user_metadata?.full_name || 'Admin Petugas' });
        }
    }

    const handleLogout = () => {
        setLogoutDialogOpen(true);
        setIsOpen(false); // Close the dropdown
    };

    const confirmLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let avatarUrl = user.avatar_url;

            if (editor && image) {
                // Resize/Crop
                const canvas = editor.getImageScaledToCanvas();
                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));

                if (blob) {
                    const fileName = `avatars/${user.id}-${Date.now()}.jpg`;
                    const { error: uploadError } = await supabase.storage
                        .from('avatars') // Ensure this bucket exists!
                        .upload(fileName, blob, { upsert: true });

                    if (uploadError) {
                        // If bucket doesn't exist, try to upload to population_docs as fallback or handle error
                        // But we should assume avatars bucket is created or we use a common one.
                        console.error("Upload error (check if 'avatars' bucket exists):", uploadError);
                        // Fallback: try population_docs if 404
                        if (uploadError.message.includes("bucket")) {
                            toast.error("Bucket 'avatars' belum dibuat di Supabase.");
                            setLoading(false);
                            return;
                        }
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);

                    avatarUrl = publicUrl;
                }
            }

            // Update Auth Metadata
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: formData.full_name,
                    avatar_url: avatarUrl
                }
            });

            if (error) throw error;

            toast.success("Profil berhasil diperbarui!");
            setUser(prev => prev ? { ...prev, full_name: formData.full_name, avatar_url: avatarUrl } : null);
            setShowEditModal(false);
            setImage(null);

            // Force reload to update Layout or use Context (better)
            // For now, we update local state which is fine for this component but Layout header won't update unless we share state.
            // A simple hack: reload page or communicate via event.
            window.location.reload();

        } catch (error: any) {
            toast.error("Gagal memperbarui profil: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 pl-1 hover:bg-gray-50 p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{user?.full_name || "Memuat..."}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-0.5">Administrator</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border-2 border-white shadow-sm ring-1 ring-blue-100 overflow-hidden relative">
                    {user?.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt="Profile"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`;
                            }}
                        />
                    ) : (
                        <span>{user?.full_name?.[0]?.toUpperCase() || "A"}</span>
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                        <p className="text-xs font-semibold text-gray-500 px-2 py-1">AKUN SAYA</p>
                        <div className="px-2 py-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <div className="p-1">
                        <button
                            onClick={() => { setShowEditModal(true); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors flex items-center gap-2"
                        >
                            <User className="h-4 w-4" />
                            Edit Profil
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            Keluar
                        </button>
                    </div>
                </div>
            )}

            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Profil</DialogTitle>
                        <DialogDescription>
                            Perbarui informasi profil dan foto Anda di sini.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="h-24 w-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative">
                                    {image ? (
                                        <AvatarEditor
                                            ref={setEditor}
                                            image={image}
                                            width={96}
                                            height={96}
                                            border={0}
                                            borderRadius={48}
                                            scale={scale}
                                        />
                                    ) : user?.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt="Profile"
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`;
                                            }}
                                        />
                                    ) : (
                                        <span className="text-3xl font-bold text-slate-300">
                                            {user?.full_name?.[0]?.toUpperCase()}
                                        </span>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="h-8 w-8 text-white" />
                                    </div>
                                </div>
                                <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1.5 border-2 border-white shadow-sm">
                                    <Camera className="h-3 w-3 text-white" />
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            {image && (
                                <div className="w-full px-4">
                                    <Label className="text-xs mb-1 block">Zoom</Label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="2"
                                        step="0.01"
                                        value={scale}
                                        onChange={(e) => setScale(parseFloat(e.target.value))}
                                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Lengkap</Label>
                            <Input
                                id="name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={user?.email || ''}
                                disabled
                                className="bg-slate-50 text-muted-foreground"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditModal(false)}>Batal</Button>
                        <Button onClick={handleSaveProfile} disabled={loading} className="min-w-[100px]">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Logout Alert */}
            <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin keluar dari aplikasi SI-PENDUDUK?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmLogout} className="bg-red-600 hover:bg-red-700 text-white">
                            Keluar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
