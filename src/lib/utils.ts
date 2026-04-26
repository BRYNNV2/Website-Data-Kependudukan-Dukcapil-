import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseExcelDate(excelDate: any): string | null {
    if (!excelDate) return null;
    
    if (typeof excelDate === 'number' || (!isNaN(Number(excelDate)) && String(excelDate).trim() !== '')) {
        const serial = Number(excelDate);
        const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
    }
    
    if (typeof excelDate === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(excelDate)) return excelDate;
        
        const d = new Date(excelDate);
        if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }
        
        const parts = excelDate.split(/[\/\-]/);
        if (parts.length === 3) {
            if (parts[2].length === 4) {
                // DD/MM/YYYY or MM/DD/YYYY, fallback to string if unclear
            }
        }
    }
    
    return String(excelDate);
}
