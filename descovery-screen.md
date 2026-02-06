<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Journey Discovery View - Detailed Stops</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,typography,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        primary: "#D27C5C", // Earthy Terracotta
                        "background-light": "#F9F6F2", // Creamy Paper
                        "background-dark": "#121212", // Deep Slate
                        "accent-orange": "#E89B74",
                        "accent-green": "#74A48A"
                    },
                    fontFamily: {
                        display: ["Outfit", "sans-serif"],
                        sans: ["Outfit", "sans-serif"],
                    },
                    borderRadius: {
                        DEFAULT: "1.5rem",
                    },
                },
            },
        };
    </script>
<style type="text/tailwindcss">
        .dashed-path {
            stroke-dasharray: 8;
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
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-slate-100 antialiased h-screen overflow-hidden">
<div class="h-12 w-full flex items-center justify-between px-8 pt-4 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-50">
<span class="text-sm font-semibold">9:41</span>
<div class="flex items-center space-x-2">
<span class="material-symbols-outlined text-[18px]">signal_cellular_alt</span>
<span class="material-symbols-outlined text-[18px]">wifi</span>
<span class="material-symbols-outlined text-[18px]">battery_full</span>
</div>
</div>
<main class="h-[calc(100vh-140px)] overflow-y-auto pb-40">
<header class="px-6 py-4">
<h1 class="text-2xl font-bold tracking-tight">Discover</h1>
</header>
<div class="px-4 pb-20">
<div class="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
<div class="relative h-[320px]">
<div class="absolute top-4 inset-x-0 flex justify-center space-x-1.5 z-20">
<div class="w-1.5 h-1.5 rounded-full bg-white"></div>
<div class="w-1.5 h-1.5 rounded-full bg-white/40"></div>
<div class="w-1.5 h-1.5 rounded-full bg-white/40"></div>
</div>
<img alt="Alex" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIXxWnsEDxzdTQP--JNJhltsfGURu6XVV4NBZWjVBTZ1skSBZSINxKLPrRAv3HD7p_wMgjR0Z0DSpwEgsfSs0bPh45VKHMXzybb4uVOLjRHhD4_X-HxkkcOU74zmeHVR7anUSLzRZSIYMJ6PFI0_p_2iOCLyahUS22olqI23fpPs7sb0Dig_LdJqDDesm0Z_AhB_8XxHOdrSWWJtlTrZh0N9nQJ0dtWBKmS_xoZavqYF7sw8ORFtdAjSRN8B7ECk38TZKwG7oe5B0"/>
<div class="absolute top-4 right-4 w-28 h-28 rounded-2xl overflow-hidden border-2 border-white shadow-lg pointer-events-auto opacity-90 group cursor-pointer">
<div class="absolute inset-0 bg-slate-100 dark:bg-slate-900 opacity-80"></div>
<svg class="absolute inset-0 w-full h-full" fill="none" viewBox="0 0 100 100">
<path class="dashed-path" d="M -10 90 C 20 80 50 95 60 50 C 70 10 90 25 110 10" stroke="#D27C5C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
</svg>
<div class="absolute inset-0 flex items-center justify-center">
<div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
</div>
<div class="absolute bottom-1 right-1 bg-black/40 backdrop-blur-sm rounded-lg p-1">
<span class="material-symbols-outlined text-white text-[16px]">open_in_full</span>
</div>
</div>
<div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-12">
<div class="flex items-center space-x-1.5">
<h2 class="text-2xl font-bold text-white">Alex, 31</h2>
<span class="material-symbols-outlined text-blue-400 text-xl fill-1">verified</span>
</div>
<p class="text-white/80 text-sm font-medium">Vanlife • Remote Developer</p>
</div>
</div>
<div class="p-6 space-y-5">
<div class="space-y-1">
<div class="flex items-center space-x-2">
<span class="material-symbols-outlined text-primary text-xl">explore</span>
<h2 class="text-lg font-bold">Paths cross in Malaga</h2>
</div>
<p class="text-slate-600 dark:text-slate-300 text-sm font-bold">March 12 — March 16 <span class="text-slate-400 font-normal ml-1">• Within 20km</span></p>
</div>
<div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
<p class="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                            "Chasing sunsets and fast Wi-Fi in my DIY Sprinter. Currently exploring the Iberian coast before heading south."
                        </p>
</div>
<div class="flex flex-wrap gap-2">
<div class="flex items-center space-x-1 bg-primary/10 dark:bg-primary/20 text-primary px-3 py-1 rounded-full">
<span class="text-[11px] font-bold tracking-tight">Surfing</span>
</div>
<div class="flex items-center space-x-1 bg-primary/10 dark:bg-primary/20 text-primary px-3 py-1 rounded-full">
<span class="text-[11px] font-bold tracking-tight">Specialty Coffee</span>
</div>
<div class="flex items-center space-x-1 bg-primary/10 dark:bg-primary/20 text-primary px-3 py-1 rounded-full">
<span class="text-[11px] font-bold tracking-tight">Solar Tech</span>
</div>
</div>
<div class="space-y-3 pt-2">
<div class="flex items-center justify-between">
<h3 class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Journey Stops</h3>
</div>
<div class="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-2 px-2 snap-x">
<div class="flex-shrink-0 snap-start bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 w-36">
<p class="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Start</p>
<p class="text-sm font-bold truncate">Lisbon</p>
<p class="text-[10px] text-slate-500">Origin</p>
</div>
<div class="flex-shrink-0 snap-start bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 w-36">
<p class="text-[9px] font-bold text-primary uppercase mb-0.5">Stop 1</p>
<p class="text-sm font-bold truncate">Madrid</p>
<p class="text-[10px] text-slate-500">Feb 28</p>
</div>
<div class="flex-shrink-0 snap-start bg-accent-orange/10 dark:bg-accent-orange/20 p-3 rounded-2xl border-2 border-accent-orange/40 w-36 relative ring-2 ring-accent-orange/5">
<div class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent-orange rounded-full flex items-center justify-center">
<span class="material-symbols-outlined text-white text-[10px]">location_on</span>
</div>
<p class="text-[9px] font-bold text-accent-orange uppercase mb-0.5">Overlap</p>
<p class="text-sm font-bold truncate">Malaga</p>
<p class="text-[10px] text-slate-600 dark:text-slate-400">Mar 12</p>
</div>
<div class="flex-shrink-0 snap-start bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 w-36">
<p class="text-[9px] font-bold text-primary uppercase mb-0.5">Stop 3</p>
<p class="text-sm font-bold truncate">Marrakech</p>
<p class="text-[10px] text-slate-500">Apr 05</p>
</div>
</div>
</div>
<div class="flex flex-wrap gap-2">
<div class="flex items-center space-x-1 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full">
<span class="material-symbols-outlined text-[14px]">airport_shuttle</span>
<span class="text-[11px] font-medium">Vanlife</span>
</div>
<div class="flex items-center space-x-1 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full">
<span class="material-symbols-outlined text-[14px]">terrain</span>
<span class="text-[11px] font-medium">Off-roading</span>
</div>
</div>
</div>
</div>
</div>
</main>
<div class="fixed bottom-28 left-1/2 -translate-x-1/2 flex items-center space-x-8 z-40">
<button class="w-[72px] h-[72px] rounded-full bg-white dark:bg-slate-800 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.2)] border-4 border-slate-50 dark:border-slate-700 flex items-center justify-center group active:scale-95 transition-all">
<span class="material-symbols-outlined text-4xl text-slate-400 group-hover:text-red-500 transition-colors">close</span>
</button>
<button class="w-[80px] h-[80px] rounded-full bg-primary shadow-[0_20px_40px_-5px_rgba(210,124,92,0.6)] flex items-center justify-center active:scale-95 transition-all border-4 border-white/20">
<span class="material-symbols-outlined text-4xl text-white">favorite</span>
</button>
</div>
<nav class="fixed bottom-0 inset-x-0 h-24 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-4 pb-4 z-50">
<button class="flex flex-col items-center space-y-1 text-primary">
<span class="material-symbols-outlined">explore</span>
<span class="text-[10px] font-bold">Discover</span>
</button>
<button class="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors">
<span class="material-symbols-outlined">chat_bubble</span>
<span class="text-[10px] font-medium">Syncs</span>
</button>
<button class="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors">
<span class="material-symbols-outlined">groups</span>
<span class="text-[10px] font-medium">Community</span>
</button>
<button class="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors">
<span class="material-symbols-outlined">person</span>
<span class="text-[10px] font-medium">Profile</span>
</button>
</nav>

</body></html>

