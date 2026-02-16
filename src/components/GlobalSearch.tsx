
import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { Input } from "@/components/ui/input"
import { Search, Loader2, Users, Baby, Heart, HeartCrack, BookX, CreditCard, ChevronRight, X, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SearchResult {
    type: 'penduduk' | 'kk' | 'akta_kelahiran' | 'akta_perkawinan' | 'akta_perceraian' | 'akta_kematian'
    id: number
    title: string
    subtitle: string
    date?: string
    icon: any
    color: string
    link: string
}

export function GlobalSearch() {
    const [open, setOpen] = useState(false)
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const mobileInputRef = useRef<HTMLInputElement>(null)

    // Close dropdown when clicking outside (Desktop)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const performSearch = useCallback(async (searchTerm: string) => {
        const q = searchTerm.trim()
        const currentResults: SearchResult[] = []

        try {
            // 1. Penduduk (KTP)
            const { data: d1 } = await supabase
                .from('penduduk')
                .select('*')
                .or(`nama_lengkap.ilike.%${q}%,nik.ilike.%${q}%`)
                .limit(3)

            if (d1) d1.forEach((item: any) => currentResults.push({
                type: 'penduduk',
                id: item.id,
                title: item.nama_lengkap,
                subtitle: `NIK: ${item.nik}`,
                date: item.created_at,
                // @ts-ignore
                icon: CreditCard,
                color: "text-blue-600 bg-blue-50",
                link: `/input-data/ktp?search=${encodeURIComponent(item.nik)}`
            }))

            // 2. Kartu Keluarga
            const { data: d2 } = await supabase
                .from('kartu_keluarga')
                .select('*')
                .or(`kepala_keluarga.ilike.%${q}%,no_kk.ilike.%${q}%`)
                .limit(3)

            if (d2) d2.forEach((item: any) => currentResults.push({
                type: 'kk',
                id: item.id,
                title: item.kepala_keluarga,
                subtitle: `No KK: ${item.no_kk}`,
                date: item.created_at,
                // @ts-ignore
                icon: Users,
                color: "text-green-600 bg-green-50",
                link: `/input-data/kartu-keluarga?search=${encodeURIComponent(item.no_kk)}`
            }))

            // 3. Akta Kelahiran
            const { data: d3 } = await supabase
                .from('akta_kelahiran')
                .select('*')
                .or(`nama_anak.ilike.%${q}%,no_akta.ilike.%${q}%,nama_ayah.ilike.%${q}%,nama_ibu.ilike.%${q}%`)
                .limit(3)

            if (d3) d3.forEach((item: any) => currentResults.push({
                type: 'akta_kelahiran',
                id: item.id,
                title: item.nama_anak,
                subtitle: `Anak: ${item.nama_ayah} & ${item.nama_ibu}`,
                date: item.created_at,
                // @ts-ignore
                icon: Baby,
                color: "text-orange-600 bg-orange-50",
                link: `/input-data/akta-kelahiran?search=${encodeURIComponent(item.no_akta)}`
            }))

            // 4. Akta Perkawinan
            const { data: d4 } = await supabase
                .from('akta_perkawinan')
                .select('*')
                .or(`nama_suami.ilike.%${q}%,nama_istri.ilike.%${q}%,no_akta.ilike.%${q}%`)
                .limit(3)

            if (d4) d4.forEach((item: any) => currentResults.push({
                type: 'akta_perkawinan',
                id: item.id,
                title: `${item.nama_suami} & ${item.nama_istri}`,
                subtitle: `Akta Kawin: ${item.no_akta}`,
                date: item.created_at,
                // @ts-ignore
                icon: Heart,
                color: "text-pink-600 bg-pink-50",
                link: `/input-data/akta-perkawinan?search=${encodeURIComponent(item.no_akta)}`
            }))

            // 5. Akta Perceraian
            const { data: d5 } = await supabase
                .from('akta_perceraian')
                .select('*')
                .or(`nama_suami.ilike.%${q}%,nama_istri.ilike.%${q}%,no_akta.ilike.%${q}%`)
                .limit(3)

            if (d5) d5.forEach((item: any) => currentResults.push({
                type: 'akta_perceraian',
                id: item.id,
                title: `${item.nama_suami} & ${item.nama_istri}`,
                subtitle: `Akta Cerai: ${item.no_akta}`,
                date: item.created_at,
                // @ts-ignore
                icon: HeartCrack,
                color: "text-purple-600 bg-purple-50",
                link: `/input-data/akta-perceraian?search=${encodeURIComponent(item.no_akta)}`
            }))

            // 6. Akta Kematian
            const { data: d6 } = await supabase
                .from('akta_kematian')
                .select('*')
                .or(`nama.ilike.%${q}%,no_surat.ilike.%${q}%`)
                .limit(3)

            if (d6) d6.forEach((item: any) => currentResults.push({
                type: 'akta_kematian',
                id: item.id,
                title: item.nama,
                subtitle: `No Surat: ${item.no_surat}`,
                date: item.created_at,
                // @ts-ignore
                icon: BookX,
                color: "text-slate-600 bg-slate-50",
                link: `/input-data/akta-kematian?search=${encodeURIComponent(item.nama)}`
            }))

            setResults(currentResults)
        } catch (error) {
            console.error(error)
        }
    }, [])

    // Toggle with Cmd+K or Ctrl+K (Desktop)
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                // If on desktop
                if (window.innerWidth >= 1024) {
                    if (inputRef.current) {
                        inputRef.current.focus()
                        setOpen(true)
                    }
                } else {
                    // Mobile
                    setMobileSearchOpen(true)
                }
            }
            if (e.key === "Escape") {
                setOpen(false)
                setMobileSearchOpen(false)
                if (inputRef.current) inputRef.current.blur()
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    // Search Logic
    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([])
            return
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true)
            await performSearch(query)
            setLoading(false)
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [query, performSearch])

    // Open dropdown when results available or query present (Desktop)
    useEffect(() => {
        if (!mobileSearchOpen) {
            if (query.length >= 2 || results.length > 0) {
                setOpen(true)
            } else {
                setOpen(false)
            }
        }
    }, [query, results, mobileSearchOpen])

    // Focus mobile input when opened
    useEffect(() => {
        if (mobileSearchOpen && mobileInputRef.current) {
            setTimeout(() => {
                mobileInputRef.current?.focus()
            }, 100)
        }
    }, [mobileSearchOpen])


    const handleResultClick = (link: string) => {
        setOpen(false)
        setMobileSearchOpen(false)
        setQuery("") // Optional: clear query
        navigate(link)
    }

    const ResultsList = () => (
        <>
            {loading && (
                <div className="flex items-center justify-center p-4 text-sm text-muted-foreground bg-slate-50/50">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Mencari...
                </div>
            )}

            {!loading && results.length === 0 && query.length >= 2 && (
                <div className="p-4 text-center text-sm text-muted-foreground bg-slate-50/50">
                    Tidak ada hasil untuk "{query}"
                </div>
            )}

            {!loading && results.length > 0 && (
                <div className="py-1">
                    <h4 className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">Hasil ({results.length})</h4>
                    {results.map((result, idx) => (
                        <div
                            key={`${result.type}-${result.id}-${idx}`}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm transition-all hover:bg-indigo-50/50 cursor-pointer border-l-2 border-transparent hover:border-indigo-500"
                            onClick={() => handleResultClick(result.link)}
                        >
                            <div className={cn("flex h-8 w-8 items-center justify-center rounded-full shrink-0 shadow-sm", result.color.replace('bg-', 'bg-opacity-20 '))}>
                                <result.icon className={cn("h-4 w-4", result.color.split(' ')[0])} />
                            </div>
                            <div className="flex-1 overflow-hidden min-w-0">
                                <div className="font-medium text-slate-800 truncate leading-snug">{result.title}</div>
                                <div className="text-[11px] text-muted-foreground truncate leading-snug">{result.subtitle}</div>
                            </div>
                            <ChevronRight className="h-3 w-3 text-slate-300" />
                        </div>
                    ))}
                </div>
            )}
        </>
    )

    return (
        <>
            {/* Desktop View */}
            <div ref={containerRef} className="relative hidden w-full max-w-sm md:w-64 lg:w-96 group z-50 lg:block">
                <div className="relative">
                    <Search className={cn("absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground transition-colors",
                        (open || query) ? "text-indigo-600" : "group-hover:text-indigo-600"
                    )} />
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Cari warga, NIK, KK... (Ctrl+K)"
                        className={cn(
                            "pl-10 pr-12 w-full transition-all duration-200 border-none bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-100",
                            open ? "rounded-b-none ring-2 ring-indigo-100 bg-white shadow-sm" : "rounded-md"
                        )}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => {
                            if (query.length >= 2) setOpen(true)
                        }}
                    />

                    {query ? (
                        <button
                            onClick={() => {
                                setQuery("")
                                setOpen(false)
                                inputRef.current?.focus()
                            }}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : (
                        <kbd className="pointer-events-none absolute right-2 top-2.5 hidden h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    )}
                </div>

                {/* Dropdown Results (Desktop) */}
                {open && (
                    <div className="absolute top-full left-0 w-full bg-white rounded-b-md shadow-lg border-x border-b border-indigo-100 max-h-[70vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 origin-top">
                        <ResultsList />
                        <div className="px-3 py-2 bg-slate-50 border-t text-[10px] text-muted-foreground flex justify-between">
                            <span>Global Search</span>
                            <span>ESC to close</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile View Trigger */}
            <div className="lg:hidden">
                <Button variant="ghost" size="icon" onClick={() => setMobileSearchOpen(true)} className="text-slate-500">
                    <Search className="h-5 w-5" />
                </Button>
            </div>

            {/* Mobile Search Overlay used PORTAL */}
            {mobileSearchOpen && createPortal(
                <div className="fixed inset-0 z-[9999] bg-white flex flex-col animate-in fade-in duration-200 lg:hidden">
                    <div className="flex items-center gap-2 p-4 border-b bg-white safe-area-top">
                        <Button variant="ghost" size="icon" onClick={() => setMobileSearchOpen(false)} className="shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                ref={mobileInputRef}
                                className="pl-9 pr-8 bg-slate-100 border-none focus-visible:ring-indigo-500 h-10"
                                placeholder="Cari nama, NIK, KK..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value as string)}
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery("")}
                                    className="absolute right-2 top-2.5 text-muted-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 bg-white safe-area-bottom">
                        {query.length < 2 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50">
                                <Search className="h-12 w-12 mb-2" />
                                <p className="text-sm">Ketik untuk mencari...</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <ResultsList />
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
