<!DOCTYPE html>
<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Nomad Community Feed</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet"/>
<script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        primary: "#B65A3D", // Earthy Terracotta
                        secondary: "#D9C5B2", // Warm Sand
                        "background-light": "#FDF9F5", // Warm Parchment
                        "background-dark": "#121212", // Deep Charcoal
                        "card-light": "#FFFFFF",
                        "card-dark": "#1E1E1E",
                    },
                    fontFamily: {
                        display: ["Outfit", "sans-serif"],
                        body: ["Outfit", "sans-serif"],
                    },
                    borderRadius: {
                        DEFAULT: "1.25rem",
                        'xl': '1.5rem',
                        '2xl': '2rem',
                    },
                },
            },
        };
    </script>
<style>
        body {
            font-family: 'Outfit', sans-serif;
            -webkit-tap-highlight-color: transparent;
        }
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 min-h-screen flex flex-col">
<div class="h-11 w-full bg-background-light dark:bg-background-dark sticky top-0 z-50"></div>
<header class="sticky top-11 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-secondary/20 dark:border-white/5">
<h1 class="text-2xl font-bold tracking-tight">Community</h1>
<button class="bg-primary hover:opacity-90 transition-all text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
<span class="material-icons-round">add</span>
</button>
</header>
<main class="flex-1 pb-24">
<section class="py-6 overflow-hidden">
<div class="flex gap-3 px-6 overflow-x-auto hide-scrollbar">
<button class="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold flex-shrink-0">
                    All
                </button>
<button class="bg-secondary/20 dark:bg-white/5 hover:bg-secondary/30 transition-colors px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 flex-shrink-0">
<span class="material-icons-round text-amber-500 text-lg">bolt</span>
                    Electrical
                </button>
<button class="bg-secondary/20 dark:bg-white/5 hover:bg-secondary/30 transition-colors px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 flex-shrink-0 border border-primary/10">
<span class="material-icons-round text-blue-500 text-lg">water_drop</span>
                    Plumbing
                </button>
<button class="bg-secondary/20 dark:bg-white/5 hover:bg-secondary/30 transition-colors px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 flex-shrink-0">
<span class="material-icons-round text-orange-500 text-lg">wb_sunny</span>
                    Solar
                </button>
<button class="bg-secondary/20 dark:bg-white/5 hover:bg-secondary/30 transition-colors px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 flex-shrink-0">
<span class="material-icons-round text-emerald-500 text-lg">laptop_mac</span>
                    Remote Work
                </button>
</div>
</section>
<div class="px-5 space-y-6">
<article class="bg-card-light dark:bg-card-dark rounded-2xl p-5 shadow-sm border border-secondary/10 dark:border-white/5">
<div class="flex justify-between items-start mb-4">
<span class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1">
<span class="material-icons-round text-sm">water_drop</span> Plumbing
                    </span>
<div class="flex items-center gap-1 text-slate-400 dark:text-slate-500 font-medium">
<span class="material-icons-round text-lg">north</span>
<span>12</span>
</div>
</div>
<h3 class="text-xl font-bold mb-2 leading-tight">Best water filtration for full-time living?</h3>
<p class="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed line-clamp-2">
                    I'm heading into Baja next month and I'm worried about the water quality. Has anyone used the Clearsource Ultra system or is a Berkey enough?
                </p>
<div class="w-full h-48 rounded-xl overflow-hidden mb-5 bg-secondary/10">
<img alt="Vanlife interior near sink" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOqA5tioqykE2V38EiKVsKL_vpGIWJKSR-w5JZQzo1DHcyAMMILSuoI5fkuIV3Z1g-p256l8QzN86xSzjdaXR2kP0M3Xf5IC3ir0gHM6IwsNjuhO4hmYnkE2wF2X2_ZchQ-u9za4I0QVyRUH-xCEs2XqusO5q3LgUL2nrhEMPl8HHaFbCSWSwjE9HytKHjeVc8KvSNaPjGyA3olMW0X5z-TiAK7ou2jy98gEX2ooDrTn_QzS4gQxrK33I_GR_VS_gdGUaYzimXrrk"/>
</div>
<div class="flex items-center justify-between pt-4 border-t border-secondary/10 dark:border-white/5">
<div class="flex items-center gap-3">
<img alt="Author avatar" class="w-8 h-8 rounded-full border-2 border-primary/20 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2DAlt4z6HqNkGZp07q9jg2_95dsze5oLDliKSunHPEwGyVOdjWLbKrpZr1ygnJFbgjMJQDicMceyWSdVO4zm1paZiv7EXlGIBVzQLNRadJDFbrGrgFOVAEDQUnwaHvl39lcKnFzWg5XErXZe-W3_Iujvq3fTjjiHQN_4wY7lPBwe9WfDXEyrM0svGjZ9fv5jWTR9gVdVpoBQg49T63JbAcmgxAS6q_qUkkU6-mh9JaJfgNMdoHDV_qEpsW1jNXDvJD1ZibIeFUFs"/>
<div>
<p class="text-sm font-bold">Julian Wild</p>
<span class="bg-secondary/20 dark:bg-white/10 text-[10px] px-2 py-0.5 rounded-md font-semibold text-primary uppercase">🚐 Sprinter</span>
</div>
</div>
<div class="flex items-center gap-4 text-slate-400 text-xs font-medium">
<span class="flex items-center gap-1">
<span class="material-icons-round text-sm">chat_bubble_outline</span> 8
                        </span>
<span>Feb 5</span>
</div>
</div>
</article>
<article class="bg-card-light dark:bg-card-dark rounded-2xl p-5 shadow-sm border border-secondary/10 dark:border-white/5">
<div class="flex justify-between items-start mb-4">
<span class="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1">
<span class="material-icons-round text-sm">bolt</span> Electrical
                    </span>
<div class="flex items-center gap-1 text-slate-400 dark:text-slate-500 font-medium">
<span class="material-icons-round text-lg">north</span>
<span>24</span>
</div>
</div>
<h3 class="text-xl font-bold mb-2 leading-tight">Alternator charging issues with Victron Orion</h3>
<p class="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed">
                    Ever since I upgraded my battery bank, the DC-DC charger keeps cutting out after about 15 minutes of driving. Cables are 2AWG, fuses look good. Any ideas?
                </p>
<div class="flex items-center justify-between pt-4 border-t border-secondary/10 dark:border-white/5">
<div class="flex items-center gap-3">
<img alt="Author avatar" class="w-8 h-8 rounded-full border-2 border-primary/20 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgBZapHvjl2phyQzRIc8zp4oVxz4KHfDvJ2HytlQ-ZT3h-Y5ar5P18r-PAvoWH3hXDl2pYQDIcQ57BmAYIzkWEDf_NaZuSS1U3q4AvGAZyO129K6-xzmQ5Ynyl2M_HKJx4TR0-iF29H90vmQVfltKgrLaT4qUYkPT7qRaBRyXcm5m5ZbEzoMsROV7ik1_t5OLEMKFK-FvlDpi7bz1oDoz5E4VzueSlJACi7ORgjOsVAJQCy0Lej1SuxOSucuDQTiqQlof0JG3vDUk"/>
<div>
<p class="text-sm font-bold">Maya Fern</p>
<span class="bg-secondary/20 dark:bg-white/10 text-[10px] px-2 py-0.5 rounded-md font-semibold text-primary uppercase">🚌 Skoolie</span>
</div>
</div>
<div class="flex items-center gap-4 text-slate-400 text-xs font-medium">
<span class="flex items-center gap-1">
<span class="material-icons-round text-sm">chat_bubble_outline</span> 15
                        </span>
<span>Feb 4</span>
</div>
</div>
</article>
</div>
</main>
<nav class="fixed bottom-0 left-0 right-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-t border-secondary/20 dark:border-white/5 px-6 pb-8 pt-3 flex justify-between items-center z-50">
<button class="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 transition-colors">
<span class="material-icons-round text-2xl">explore</span>
<span class="text-[10px] font-bold uppercase tracking-tight">Discover</span>
</button>
<button class="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 transition-colors">
<span class="material-icons-round text-2xl">swap_horiz</span>
<span class="text-[10px] font-bold uppercase tracking-tight">Syncs</span>
</button>
<button class="flex flex-col items-center gap-1 text-primary transition-colors">
<span class="material-icons-round text-2xl">groups</span>
<span class="text-[10px] font-bold uppercase tracking-tight">Community</span>
<div class="w-1 h-1 bg-primary rounded-full absolute -bottom-1"></div>
</button>
<button class="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 transition-colors">
<span class="material-icons-round text-2xl">account_circle</span>
<span class="text-[10px] font-bold uppercase tracking-tight">Profile</span>
</button>
</nav>
<div class="fixed bottom-1 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full z-50 pointer-events-none"></div>

</body></html>