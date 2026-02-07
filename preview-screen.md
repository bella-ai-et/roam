<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Discovery Preview State</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,typography,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        primary: "#D27C5C",
                        "background-light": "#F9F6F2",
                        "background-dark": "#121212",
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
<body class="bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-slate-100 antialiased h-screen overflow-hidden flex flex-col">
<div class="h-12 w-full flex items-center justify-between px-8 shrink-0 z-50">
<span class="text-sm font-semibold">9:41</span>
<div class="flex items-center space-x-2">
<span class="material-symbols-outlined text-[18px]">signal_cellular_alt</span>
<span class="material-symbols-outlined text-[18px]">wifi</span>
<span class="material-symbols-outlined text-[18px]">battery_full</span>
</div>
</div>
<main class="flex-1 relative flex flex-col px-4 pb-4 overflow-hidden">
<div class="relative flex-1 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
<div class="relative flex-1">
<div class="absolute top-4 inset-x-0 flex justify-center space-x-1.5 z-20">
<div class="w-1.5 h-1.5 rounded-full bg-white"></div>
<div class="w-1.5 h-1.5 rounded-full bg-white/40"></div>
<div class="w-1.5 h-1.5 rounded-full bg-white/40"></div>
<div class="w-1.5 h-1.5 rounded-full bg-white/40"></div>
</div>
<img alt="Alex" class="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIXxWnsEDxzdTQP--JNJhltsfGURu6XVV4NBZWjVBTZ1skSBZSINxKLPrRAv3HD7p_wMgjR0Z0DSpwEgsfSs0bPh45VKHMXzybb4uVOLjRHhD4_X-HxkkcOU74zmeHVR7anUSLzRZSIYMJ6PFI0_p_2iOCLyahUS22olqI23fpPs7sb0Dig_LdJqDDesm0Z_AhB_8XxHOdrSWWJtlTrZh0N9nQJ0dtWBKmS_xoZavqYF7sw8ORFtdAjSRN8B7ECk38TZKwG7oe5B0"/>
<div class="absolute top-4 right-4 w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/50 shadow-lg z-20 backdrop-blur-md bg-white/10">
<svg class="absolute inset-0 w-full h-full" fill="none" viewBox="0 0 100 100">
<path class="dashed-path" d="M -10 90 C 20 80 50 95 60 50 C 70 10 90 25 110 10" stroke="#D27C5C" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"></path>
</svg>
<div class="absolute inset-0 flex items-center justify-center">
<div class="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_12px_rgba(210,124,92,0.8)]"></div>
</div>
</div>
<div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-8 pb-32">
<div class="flex items-center space-x-2">
<h2 class="text-3xl font-bold text-white">Alex, 31</h2>
<span class="material-symbols-outlined text-blue-400 text-2xl fill-1">verified</span>
</div>
<p class="text-white/90 text-lg font-medium mt-1">Vanlife • Remote Developer</p>
</div>
</div>
<div class="absolute bottom-8 left-0 right-0 flex items-center justify-center space-x-6 z-40">
<button class="w-18 h-18 w-[72px] h-[72px] rounded-full bg-white dark:bg-slate-800 shadow-2xl border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center group active:scale-90 transition-transform">
<span class="material-symbols-outlined text-4xl text-slate-400 group-hover:text-red-500">close</span>
</button>
<button class="w-18 h-18 w-[72px] h-[72px] rounded-full bg-primary shadow-2xl flex items-center justify-center active:scale-90 transition-transform border-4 border-white/20">
<span class="material-symbols-outlined text-4xl text-white">favorite</span>
</button>
</div>
</div>
</main>
<nav class="h-24 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-4 pb-6 shrink-0 z-50">
<button class="flex flex-col items-center space-y-1 text-primary">
<span class="material-symbols-outlined">explore</span>
<span class="text-[10px] font-bold">Discover</span>
</button>
<button class="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500">
<span class="material-symbols-outlined">chat_bubble</span>
<span class="text-[10px] font-medium">Syncs</span>
</button>
<button class="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500">
<span class="material-symbols-outlined">groups</span>
<span class="text-[10px] font-medium">Community</span>
</button>
<button class="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500">
<span class="material-symbols-outlined">person</span>
<span class="text-[10px] font-medium">Profile</span>
</button>
</nav>

</body></html>