import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "./ui/button"
import { AlertTriangle, RefreshCcw } from "lucide-react"

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                    <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 max-w-md w-full animate-in fade-in zoom-in duration-300">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Terjadi Kesalahan Sistem</h1>
                        <p className="text-muted-foreground mb-6">
                            Sistem mengalami kendala tak terduga. Kami telah mencatat error ini untuk diperbaiki.
                        </p>

                        <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-left text-xs text-red-700 font-mono mb-6 overflow-auto max-h-32">
                            {this.state.error?.message}
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
                            >
                                <RefreshCcw className="h-4 w-4" />
                                Muat Ulang Halaman
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                                Jika masalah berlanjut, silakan hubungi tim IT Support.
                            </p>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
