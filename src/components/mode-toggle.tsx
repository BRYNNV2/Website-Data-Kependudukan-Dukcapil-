import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"

export function ModeToggle() {
    const { setTheme, theme } = useTheme()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={ref}>
            <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
            </Button>
            {open && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-950 rounded-md shadow-lg border dark:border-slate-800 z-50 overflow-hidden">
                    <div className="flex flex-col p-1">
                        <button
                            onClick={() => { setTheme("light"); setOpen(false) }}
                            className={`flex items-center w-full px-2 py-1.5 text-sm rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${theme === 'light' ? 'bg-slate-100 dark:bg-slate-800 font-medium' : ''}`}
                        >
                            Light
                        </button>
                        <button
                            onClick={() => { setTheme("dark"); setOpen(false) }}
                            className={`flex items-center w-full px-2 py-1.5 text-sm rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${theme === 'dark' ? 'bg-slate-100 dark:bg-slate-800 font-medium' : ''}`}
                        >
                            Dark
                        </button>
                        <button
                            onClick={() => { setTheme("system"); setOpen(false) }}
                            className={`flex items-center w-full px-2 py-1.5 text-sm rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${theme === 'system' ? 'bg-slate-100 dark:bg-slate-800 font-medium' : ''}`}
                        >
                            System
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
