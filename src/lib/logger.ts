import { supabase } from "./supabaseClient";

export async function logActivity(action: string, details: string) {
    try {
        // Get current user info
        const { data: { user } } = await supabase.auth.getUser();

        let userName = "Admin Petugas";
        if (user && user.user_metadata && user.user_metadata.full_name) {
            userName = user.user_metadata.full_name;
        }

        const { error } = await supabase
            .from('activity_logs')
            .insert({
                user_name: userName,
                action: action,
                details: details
            });

        if (error) {
            console.error("Failed to save log:", error);
        }
    } catch (err) {
        console.error("Error logging activity:", err);
    }
}
