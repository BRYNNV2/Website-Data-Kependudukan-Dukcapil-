import { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { supabase } from '@/lib/supabaseClient';
import { useTheme } from '@/components/theme-provider';

export function OnboardingTour() {
    const [run, setRun] = useState(false);
    const { theme } = useTheme();

    const steps: Step[] = [
        {
            target: 'body',
            placement: 'center',
            title: '👋 Selamat Datang di SI-PENDUDUK!',
            content: 'Aplikasi pengelolaan data kependudukan modern. Mari ikuti tur singkat ini untuk memahami fitur-fitur canggih yang tersedia.',
            disableBeacon: true,
        },
        {
            target: '#nav-dashboard',
            content: (
                <div>
                    Halaman <strong>Dashboard</strong> adalah pusat kendali Anda. Pantau statistik penduduk, grafik pertumbuhan, dan ringkasan data harian secara <em>real-time</em> di sini.
                </div>
            ),
            placement: 'right',
        },
        {
            target: '#nav-input-data',
            content: (
                <div>
                    Menu <strong>Input Data</strong> adalah dapur kerja Anda. Kelola data <strong>KK, KTP,</strong> dan berbagai <strong>Akta Catatan Sipil</strong> dengan mudah melalui formulir digital ini.
                </div>
            ),
            placement: 'right',
        },
        {
            target: '#action-buttons',
            content: (
                <div>
                    Akses cepat! Gunakan tombol di atas untuk mengganti <strong>Mode Gelap 🌙</strong>, melihat <strong>Notifikasi 🔔</strong>, atau mengelola <strong>Profil 👤</strong> Anda.
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '#nav-settings',
            content: 'Perlu bantuan atau ingin ubah password? Akses menu **Pengaturan** di sini. Termasuk untuk memutar ulang tur ini kapan saja!',
            placement: 'right',
        }
    ];

    useEffect(() => {
        // Check for forced restart from Settings page
        if (localStorage.getItem('force_tour_restart')) {
            localStorage.removeItem('force_tour_restart');
            setRun(true);
        } else {
            checkTutorialStatus();
        }

        // Listen for manual tour start event
        const handleStartTour = () => setRun(true);
        window.addEventListener('start-onboarding-tour', handleStartTour);

        return () => {
            window.removeEventListener('start-onboarding-tour', handleStartTour);
        };
    }, []);

    // Effect to handle body scroll locking
    useEffect(() => {
        if (run) {
            document.body.classList.add('joyride-lock-scroll');
        } else {
            document.body.classList.remove('joyride-lock-scroll');
        }

        return () => {
            document.body.classList.remove('joyride-lock-scroll');
        }
    }, [run]);

    const checkTutorialStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // First check user metadata as fallback/cache
            if (user.user_metadata?.has_seen_tutorial) {
                return;
            }

            // Then check profiles table
            const { data: profile } = await supabase
                .from('profiles')
                .select('has_seen_tutorial')
                .eq('id', user.id)
                .single();

            if (profile && profile.has_seen_tutorial) {
                // Already seen, do nothing
            } else {
                // If not seen, start the tour
                setRun(true);
            }
        } catch (error) {
            console.log("Profile not found or error, likely first login or table missing. Starting tour safe default.");
            // If error (e.g. table doesn't exist yet), check local storage as backup to avoid annoyance
            const localSeen = localStorage.getItem('has_seen_tutorial');
            if (!localSeen) {
                setRun(true);
            }
        }
    };

    const handleJoyrideCallback = async (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);

            // Update Database & Metadata
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // Update metadata for fast check
                    await supabase.auth.updateUser({
                        data: { has_seen_tutorial: true }
                    });

                    // Update profiles table
                    await supabase
                        .from('profiles')
                        .update({ has_seen_tutorial: true })
                        .eq('id', user.id);

                    // Local fallback
                    localStorage.setItem('has_seen_tutorial', 'true');
                }
            } catch (error) {
                console.error("Failed to update tutorial status", error);
            }
        }

        // Intelligent Mobile Sidebar Control 📱
        if (data.action === 'update' || data.action === 'start' || data.type === 'step:after') {
            const sidebarSteps = [1, 2, 4];
            const nonSidebarSteps = [0, 3];

            // Force close on very first step start to ensure clean state
            if (data.index === 0 && (data.action === 'start' || data.type === 'step:before')) {
                window.dispatchEvent(new Event('close-sidebar'));
            }

            if (sidebarSteps.includes(data.index)) {
                window.dispatchEvent(new Event('open-sidebar'));
            } else if (nonSidebarSteps.includes(data.index)) {
                window.dispatchEvent(new Event('close-sidebar'));
            }
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            disableOverlayClose={true}
            spotlightClicks={false}
            disableScrolling={true}
            floaterProps={{
                disableAnimation: true,
            }}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: '#0ea5e9', // Sky-500 for a fresh modern interaction color
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    arrowColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    textColor: theme === 'dark' ? '#f8fafc' : '#1e293b',
                    overlayColor: 'rgba(0, 0, 0, 0.65)', // Darker, more dramatic overlay
                },
                tooltip: {
                    borderRadius: '16px', // Premium rounded corners
                    padding: '20px',      // More breathing room
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // Strong styling shadow
                    fontSize: '15px',
                },
                tooltipTitle: {
                    fontSize: '18px',
                    fontWeight: '700',
                    color: theme === 'dark' ? '#38bdf8' : '#0284c7', // Highlight title with primary color
                    marginBottom: '12px',
                },
                tooltipContent: {
                    lineHeight: '1.6',
                    color: theme === 'dark' ? '#cbd5e1' : '#475569',
                },
                buttonNext: {
                    backgroundColor: '#0ea5e9',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.3)', // Glow effect
                    outline: 'none',
                },
                buttonBack: {
                    color: theme === 'dark' ? '#94a3b8' : '#64748b',
                    marginRight: '10px',
                    fontWeight: 500,
                },
                buttonSkip: {
                    color: theme === 'dark' ? '#64748b' : '#94a3b8',
                    fontSize: '14px',
                }
            }}
            locale={{
                back: 'Sebelemunya',
                close: 'Tutup',
                last: 'Selesai ✨',
                next: 'Lanjut ➡',
                skip: 'Lewati Tur',
            }}
        />
    );
}
