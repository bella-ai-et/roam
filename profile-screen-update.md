<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Profile &amp; Routes - Nomad Sync</title>
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
                        "accent-teal": "#5C9D9B"
                    },
                    fontFamily: {
                        display: ["Outfit", "sans-serif"],
                        sans: ["Outfit", "sans-serif"],
                    },
                    borderRadius: {
                        DEFAULT: "1.25rem",
                    },
                },
            },
        };
    </script>
<style type="text/tailwindcss">
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .route-line {
            background-image: radial-gradient(circle, #D27C5C 20%, transparent 20%);
            background-position: center;
            background-size: 1px 10px;
            background-repeat: repeat-y;
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
<main class="h-[calc(100vh-140px)] overflow-y-auto">
<header class="px-6 py-6 flex flex-col items-center">
<div class="relative group">
<div class="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden ring-2 ring-primary/20">
<img alt="My Profile" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIXxWnsEDxzdTQP--JNJhltsfGURu6XVV4NBZWjVBTZ1skSBZSINxKLPrRAv3HD7p_wMgjR0Z0DSpwEgsfSs0bPh45VKHMXzybb4uVOLjRHhD4_X-HxkkcOU74zmeHVR7anUSLzRZSIYMJ6PFI0_p_2iOCLyahUS22olqI23fpPs7sb0Dig_LdJqDDesm0Z_AhB_8XxHOdrSWWJtlTrZh0N9nQJ0dtWBKmS_xoZavqYF7sw8ORFtdAjSRN8B7ECk38TZKwG7oe5B0"/>
</div>
<button class="absolute bottom-1 right-1 bg-primary text-white p-1.5 rounded-full border-2 border-white dark:border-slate-800 shadow-lg">
<span class="material-symbols-outlined text-sm block">edit</span>
</button>
</div>
<div class="text-center mt-4">
<h1 class="text-2xl font-bold tracking-tight flex items-center justify-center gap-2">
                    Cody Fisher <span class="material-symbols-outlined text-accent-teal text-xl fill-1">verified</span>
</h1>
<p class="text-slate-500 text-sm font-medium flex items-center justify-center gap-1 mt-1">
<span class="material-symbols-outlined text-sm">airport_shuttle</span>
                    Mercedes Sprinter '22 • Nomad for 3 yrs
                </p>
</div>
</header>
<div class="px-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm z-40">
<div class="flex space-x-8">
<button class="py-3 text-sm font-bold border-b-2 border-primary text-primary transition-all">My Routes</button>
<button class="py-3 text-sm font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-600">Bio &amp; Info</button>
<button class="py-3 text-sm font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-600">Media</button>
</div>
</div>
<section class="mt-6 px-6">
<div class="flex items-center justify-between mb-6">
<div>
<h2 class="text-lg font-bold">Planned Journey</h2>
<p class="text-xs text-slate-500">Your upcoming path &amp; stops</p>
</div>
<button class="bg-primary/10 text-primary px-4 py-2 rounded-full flex items-center space-x-2">
<span class="material-symbols-outlined text-sm">add_location</span>
<span class="text-xs font-bold uppercase tracking-tight">Add Stop</span>
</button>
</div>
<div class="relative ml-2">
<div class="absolute top-4 bottom-4 left-3.5 w-0.5 route-line"></div>
<div class="relative flex gap-6 mb-8 group">
<div class="relative z-10 w-8 flex justify-center pt-2">
<div class="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white ring-4 ring-primary/10">
<span class="material-symbols-outlined text-base">location_on</span>
</div>
</div>
<div class="flex-1 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
<div class="flex justify-between items-start">
<div>
<span class="text-[10px] font-bold text-accent-teal uppercase tracking-widest">Currently at</span>
<h3 class="font-bold text-lg">Lisbon, Portugal</h3>
<p class="text-sm text-slate-500 mt-0.5 italic">"Co-working and surfing week"</p>
</div>
<span class="text-[10px] font-bold text-slate-400">MAY 12 - 20</span>
</div>
<div class="mt-3 flex -space-x-2">
<img alt="Overlap" class="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIXxWnsEDxzdTQP--JNJhltsfGURu6XVV4NBZWjVBTZ1skSBZSINxKLPrRAv3HD7p_wMgjR0Z0DSpwEgsfSs0bPh45VKHMXzybb4uVOLjRHhD4_X-HxkkcOU74zmeHVR7anUSLzRZSIYMJ6PFI0_p_2iOCLyahUS22olqI23fpPs7sb0Dig_LdJqDDesm0Z_AhB_8XxHOdrSWWJtlTrZh0N9nQJ0dtWBKmS_xoZavqYF7sw8ORFtdAjSRN8B7ECk38TZKwG7oe5B0"/>
<img alt="Overlap" class="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbF26qCmYERYVgSU0Pz9mg4xD4dspUzKg0rxZyu-k3lcfM0MIkw8meJxgucKdeqhkHicY_DmN-A_Q_ZC9TqjFatnU27kOIqUbW2zwRh66ZRBQWwTt0cPQA1ZzrETdIjrZ2PZQSFnq9yTnX6gUXLf-cZHuXNtYYdsVGRoDn5mRG6MkOOq1woZBZqurmxS49CI9Px26XRW8Rfkvj9NuBL9cJqMdFiyq7U3myBy_OKz4GoWna_o6gBAhnMfPK5egC0WaNTxNYA4Aw8tc"/>
<div class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-bold">+12</div>
<span class="ml-10 text-[10px] text-accent-orange font-bold flex items-center">3 Syncs active</span>
</div>
</div>
</div>
<div class="relative flex gap-6 mb-8">
<div class="relative z-10 w-8 flex justify-center pt-2">
<div class="w-7 h-7 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 border-2 border-slate-200 dark:border-slate-600">
<span class="material-symbols-outlined text-base">circle</span>
</div>
</div>
<div class="flex-1 bg-white/50 dark:bg-slate-800/50 p-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
<div class="flex justify-between items-start">
<div>
<span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next Stop</span>
<h3 class="font-bold text-lg text-slate-700 dark:text-slate-300">Sagres</h3>
<p class="text-sm text-slate-500 mt-0.5">Beach camping &amp; sunset vibes</p>
</div>
<span class="text-[10px] font-bold text-slate-400">MAY 22 - 28</span>
</div>
<div class="mt-3 flex items-center gap-2">
<span class="material-symbols-outlined text-sm text-accent-teal">shuffle</span>
<span class="text-[10px] font-medium text-slate-500">2 upcoming path overlaps detected</span>
</div>
</div>
</div>
<div class="relative flex gap-6">
<div class="relative z-10 w-8 flex justify-center pt-2">
<div class="w-7 h-7 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 border-2 border-slate-200 dark:border-slate-600">
<span class="material-symbols-outlined text-base">flag</span>
</div>
</div>
<div class="flex-1 bg-white/50 dark:bg-slate-800/50 p-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
<div class="flex justify-between items-start">
<div>
<span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destination</span>
<h3 class="font-bold text-lg text-slate-700 dark:text-slate-300">Seville, Spain</h3>
</div>
<span class="text-[10px] font-bold text-slate-400">JUNE</span>
</div>
</div>
</div>
</div>
<div class="mt-10 bg-accent-orange/5 rounded-3xl p-5 border border-accent-orange/10 mb-8">
<div class="flex items-start justify-between">
<div class="flex items-center space-x-3">
<div class="w-10 h-10 bg-accent-orange/20 rounded-2xl flex items-center justify-center">
<span class="material-symbols-outlined text-accent-orange">share</span>
</div>
<div>
<h3 class="font-bold text-sm">Path Visibility</h3>
<p class="text-xs text-slate-500">Visible to Verified Syncs only</p>
</div>
</div>
<button class="bg-accent-orange text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider">Change</button>
</div>
</div>
</section>
</main>
<nav class="fixed bottom-0 inset-x-0 h-24 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-4 pb-4">
<button class="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors">
<span class="material-symbols-outlined">explore</span>
<span class="text-[10px] font-medium uppercase tracking-tight">Discover</span>
</button>
<button class="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors">
<div class="relative">
<span class="material-symbols-outlined">forum</span>
<span class="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full ring-2 ring-white dark:ring-slate-900"></span>
</div>
<span class="text-[10px] font-medium uppercase tracking-tight">Syncs</span>
</button>
<button class="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors">
<span class="material-symbols-outlined">groups</span>
<span class="text-[10px] font-medium uppercase tracking-tight">Community</span>
</button>
<button class="flex flex-col items-center space-y-1 text-primary">
<span class="material-symbols-outlined fill-1">person</span>
<span class="text-[10px] font-bold uppercase tracking-tight">Profile</span>
</button>
</nav>

</body></html>