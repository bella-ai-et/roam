<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Nomad Matches &amp; Syncs</title>
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
        .overlap-avatar {
            box-shadow: 0 0 0 3px #F9F6F2, 0 4px 12px rgba(0,0,0,0.08);
        }
        .dark .overlap-avatar {
            box-shadow: 0 0 0 3px #121212, 0 4px 12px rgba(0,0,0,0.3);
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
<main class="h-[calc(100vh-120px)] overflow-y-auto">
<header class="px-6 py-4 flex justify-between items-end">
<div>
<h1 class="text-3xl font-bold tracking-tight">Syncs</h1>
<p class="text-slate-500 text-sm font-medium">Your paths are crossing</p>
</div>
<div class="flex items-center space-x-2">
<button class="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
<span class="material-symbols-outlined text-slate-600 dark:text-slate-300">map</span>
</button>
<button class="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
<span class="material-symbols-outlined text-slate-600 dark:text-slate-300">search</span>
</button>
</div>
</header>
<section class="mt-2">
<div class="px-6 flex items-center justify-between mb-4">
<h2 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">New Route Overlaps</h2>
<span class="w-2 h-2 rounded-full bg-accent-orange"></span>
</div>
<div class="flex overflow-x-auto hide-scrollbar gap-5 px-6 pb-2">
<div class="flex-shrink-0 flex flex-col items-center space-y-2">
<div class="relative">
<div class="w-16 h-16 rounded-full overflow-hidden overlap-avatar">
<img alt="Alex" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIXxWnsEDxzdTQP--JNJhltsfGURu6XVV4NBZWjVBTZ1skSBZSINxKLPrRAv3HD7p_wMgjR0Z0DSpwEgsfSs0bPh45VKHMXzybb4uVOLjRHhD4_X-HxkkcOU74zmeHVR7anUSLzRZSIYMJ6PFI0_p_2iOCLyahUS22olqI23fpPs7sb0Dig_LdJqDDesm0Z_AhB_8XxHOdrSWWJtlTrZh0N9nQJ0dtWBKmS_xoZavqYF7sw8ORFtdAjSRN8B7ECk38TZKwG7oe5B0"/>
</div>
<div class="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm border border-slate-100 dark:border-slate-700">
<span class="material-symbols-outlined text-xs text-primary block">location_on</span>
</div>
</div>
<div class="text-center">
<p class="text-xs font-bold leading-none">Alex</p>
<p class="text-[10px] text-primary font-medium mt-1">Lisbon</p>
</div>
</div>
<div class="flex-shrink-0 flex flex-col items-center space-y-2">
<div class="relative">
<div class="w-16 h-16 rounded-full overflow-hidden overlap-avatar">
<img alt="Sarah" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbF26qCmYERYVgSU0Pz9mg4xD4dspUzKg0rxZyu-k3lcfM0MIkw8meJxgucKdeqhkHicY_DmN-A_Q_ZC9TqjFatnU27kOIqUbW2zwRh66ZRBQWwTt0cPQA1ZzrETdIjrZ2PZQSFnq9yTnX6gUXLf-cZHuXNtYYdsVGRoDn5mRG6MkOOq1woZBZqurmxS49CI9Px26XRW8Rfkvj9NuBL9cJqMdFiyq7U3myBy_OKz4GoWna_o6gBAhnMfPK5egC0WaNTxNYA4Aw8tc"/>
</div>
<div class="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm border border-slate-100 dark:border-slate-700">
<span class="material-symbols-outlined text-xs text-primary block">location_on</span>
</div>
</div>
<div class="text-center">
<p class="text-xs font-bold leading-none">Sarah</p>
<p class="text-[10px] text-primary font-medium mt-1">Malaga</p>
</div>
</div>
<div class="flex-shrink-0 flex flex-col items-center space-y-2">
<div class="relative">
<div class="w-16 h-16 rounded-full overflow-hidden overlap-avatar">
<img alt="Julian" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPwrjM9q3M1al3eeRuxwrvStIJeZhU0Pg8ioFtgb6lL0HnL6zDoJQPOk995LZ4gWQTHxiFMkf27L1KsDhL3YOR4hljC2tnt0vLKDdZN-6RE3He_GMeU1pBkzr_30yrlA4WvTrR1Bk41sjGqUrr4_CJFspHWRThG5q6ayeKCQCVNy7hbbuwPQbal9PprQqk0RnPvQEEhdPJEeb4fbUZKWSfrOGYCSzTFrFogvJK5QYXwVyhqdy55rXv_k_UDHzYysXolbkinu4q2ck"/>
</div>
<div class="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm border border-slate-100 dark:border-slate-700">
<span class="material-symbols-outlined text-xs text-primary block">location_on</span>
</div>
</div>
<div class="text-center">
<p class="text-xs font-bold leading-none">Julian</p>
<p class="text-[10px] text-primary font-medium mt-1">Madrid</p>
</div>
</div>
<div class="flex-shrink-0 flex flex-col items-center space-y-2">
<div class="relative">
<div class="w-16 h-16 rounded-full overflow-hidden overlap-avatar">
<img alt="Elena" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCw2dW4t9ljno3d7Sj6lLcjkTP1qHl62KZSru0-KXCFiT4gMU7xLS1z2dLaW6oglIpAF_xOSPzaCKT-AsxoFWF-QoUpsKZO06h7sm2zrnYv-1lHXuJh-4fXWypUA07QbyTNFz_RTGDJqHLH2wKhlgg2I4OLmoa_QxE9KwJapQbAtJLOLt7noUBog-0VsrFt-GWLecXjZILR-fqPMzLtj43QlLdOHHJiK8hROl64bYnTvie0jfnVxbDTyRBAeNpSfsYeJWNEVKCDcAI"/>
</div>
<div class="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm border border-slate-100 dark:border-slate-700">
<span class="material-symbols-outlined text-xs text-primary block">location_on</span>
</div>
</div>
<div class="text-center">
<p class="text-xs font-bold leading-none">Elena</p>
<p class="text-[10px] text-primary font-medium mt-1">Algarve</p>
</div>
</div>
</div>
</section>
<section class="mt-8 px-6 space-y-1">
<h2 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Conversations</h2>
<div class="flex items-center space-x-4 py-3 border-b border-slate-100 dark:border-slate-800/50">
<div class="relative flex-shrink-0">
<div class="w-14 h-14 rounded-2xl overflow-hidden">
<img alt="Alex" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIXxWnsEDxzdTQP--JNJhltsfGURu6XVV4NBZWjVBTZ1skSBZSINxKLPrRAv3HD7p_wMgjR0Z0DSpwEgsfSs0bPh45VKHMXzybb4uVOLjRHhD4_X-HxkkcOU74zmeHVR7anUSLzRZSIYMJ6PFI0_p_2iOCLyahUS22olqI23fpPs7sb0Dig_LdJqDDesm0Z_AhB_8XxHOdrSWWJtlTrZh0N9nQJ0dtWBKmS_xoZavqYF7sw8ORFtdAjSRN8B7ECk38TZKwG7oe5B0"/>
</div>
</div>
<div class="flex-1 min-w-0">
<div class="flex items-center space-x-2">
<h3 class="font-bold text-base">Alex</h3>
<span class="material-symbols-outlined text-slate-400 text-sm">airport_shuttle</span>
</div>
<p class="text-sm text-slate-500 truncate">Hey! Saw you're heading south too. Any tips for...</p>
<div class="mt-1 flex items-center">
<div class="bg-accent-orange/10 text-accent-orange px-2 py-0.5 rounded-full flex items-center space-x-1">
<span class="material-symbols-outlined text-[12px] fill-1">sync_alt</span>
<span class="text-[10px] font-bold uppercase tracking-tight">Crossing in 2 days</span>
</div>
</div>
</div>
<div class="flex flex-col items-end space-y-2">
<span class="text-[10px] font-bold text-slate-400">12:45</span>
<div class="w-2 h-2 rounded-full bg-primary"></div>
</div>
</div>
<div class="flex items-center space-x-4 py-3 border-b border-slate-100 dark:border-slate-800/50">
<div class="relative flex-shrink-0">
<div class="w-14 h-14 rounded-2xl overflow-hidden">
<img alt="Sarah" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCQgfvjM7x0DVGktpDR-ZZJjYlf7A3MMXd0S_HwFzFU0YFPPu8rebFux-dFdFO7MOlPFCAxTQAjKiM32bZ2xUIayU60T94qnQeYmDoVrb1FqYAgsfyQjQU8ap-LXs1h0VphDzd5dLmzts5xkY1NafHtKuOcqvd9OKUNlECyL-kQHmkB_r2SFDej_NDagiDKNSNWn9qnR-0eagVMNtlLZB7tQrQzLAIT6dEFtkhv-j5eavAZiHEX9bkOUZptpwHnh7St2OGhph1OV8"/>
</div>
</div>
<div class="flex-1 min-w-0">
<div class="flex items-center space-x-2">
<h3 class="font-bold text-base">Sarah</h3>
<span class="material-symbols-outlined text-slate-400 text-sm">pedal_bike</span>
</div>
<p class="text-sm text-slate-500 truncate">The coffee shop here is amazing.</p>
<div class="mt-1 flex items-center">
<div class="bg-accent-teal/10 text-accent-teal px-2 py-0.5 rounded-full flex items-center space-x-1">
<span class="material-symbols-outlined text-[12px] fill-1">location_on</span>
<span class="text-[10px] font-bold uppercase tracking-tight">Same Stop: Lisbon</span>
</div>
</div>
</div>
<div class="flex flex-col items-end space-y-2">
<span class="text-[10px] font-bold text-slate-400">Yest.</span>
</div>
</div>
<div class="flex items-center space-x-4 py-3 border-b border-slate-100 dark:border-slate-800/50">
<div class="relative flex-shrink-0">
<div class="w-14 h-14 rounded-2xl overflow-hidden opacity-80">
<img alt="Marco" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLDXYa7r7tIvQf2vCMCLbl4kuYHrJc0o1Ht-b0g-YBw-WlnbX9j0huzt7Zv732udzGxBSPp4hpZm4s0KVHfn_ibE7PvAbkTJRvESPJ0NFmvkWDaeJqUOVOjf8b7vTgH7zDMARs3BjlRwaWDGv1KuG-0kd6GSCWgaI3UifoEHr8DPdkFUaEv73f73sf_d3BH4Pgm_Dg3AAR4_-Od03SA-pxA7WEBV-QnppsGyQ7C9csYw5E3DpvsgsUOnjoR-qRukcQdi5Hg0cgBqU"/>
</div>
</div>
<div class="flex-1 min-w-0">
<div class="flex items-center space-x-2">
<h3 class="font-bold text-base">Marco</h3>
<span class="material-symbols-outlined text-slate-400 text-sm">directions_car</span>
</div>
<p class="text-sm text-slate-400 truncate">Safe travels! Maybe next time.</p>
<div class="mt-1 flex flex-wrap gap-2 items-center">
<div class="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full flex items-center space-x-1">
<span class="material-symbols-outlined text-[12px]">logout</span>
<span class="text-[10px] font-bold uppercase tracking-tight">Departed 3d ago</span>
</div>
<div class="flex items-center space-x-1 text-primary">
<span class="material-symbols-outlined text-[14px]">near_me</span>
<span class="text-[10px] font-bold">Moving to: Faro</span>
</div>
</div>
</div>
<div class="flex flex-col items-end space-y-2">
<span class="text-[10px] font-bold text-slate-400">Tue</span>
</div>
</div>
<div class="flex items-center space-x-4 py-3">
<div class="relative flex-shrink-0">
<div class="w-14 h-14 rounded-2xl overflow-hidden">
<img alt="Elena" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbN73erb52fffSqFP2xpqIr3ysLf9AqooouUzGbyPr59MlEN4bCgdN4csdQrqPKVq3nQ-3PF-P0eg68MH2BGmnJbvKZlNVuCdT4XOk6harKxStZktnBM3vP1AbtRlMS1YaRLxnhmOR8Z4F3vBLds2vhC-5Ow1GeVwWv5au1RE540B14hiWxmWBbHu4zmKFLLKOD9puVxzNxavje0OtvKV2GQPopumOM3fDMKnImQmd1q40bmwoZ9V85euAJsRzfLEvYlICBP_8mJs"/>
</div>
</div>
<div class="flex-1 min-w-0">
<div class="flex items-center space-x-2">
<h3 class="font-bold text-base">Elena</h3>
<span class="material-symbols-outlined text-slate-400 text-sm">airport_shuttle</span>
</div>
<p class="text-sm text-slate-500 truncate">Found a great spot by the lake!</p>
<div class="mt-1 flex items-center">
<div class="bg-accent-orange/10 text-accent-orange px-2 py-0.5 rounded-full flex items-center space-x-1">
<span class="material-symbols-outlined text-[12px] fill-1">sync_alt</span>
<span class="text-[10px] font-bold uppercase tracking-tight">Syncing in Lagos</span>
</div>
</div>
</div>
<div class="flex flex-col items-end space-y-2">
<span class="text-[10px] font-bold text-slate-400">Mon</span>
</div>
</div>
</section>
</main>
<nav class="fixed bottom-0 inset-x-0 h-24 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-4 pb-4">
<button class="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors">
<span class="material-symbols-outlined">explore</span>
<span class="text-[10px] font-medium uppercase tracking-tight">Discover</span>
</button>
<button class="flex flex-col items-center space-y-1 text-primary">
<div class="relative">
<span class="material-symbols-outlined fill-1">chat_bubble</span>
<span class="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full ring-2 ring-white dark:ring-slate-900"></span>
</div>
<span class="text-[10px] font-bold uppercase tracking-tight">Syncs</span>
</button>
<button class="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors">
<span class="material-symbols-outlined">groups</span>
<span class="text-[10px] font-medium uppercase tracking-tight">Community</span>
</button>
<button class="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors">
<span class="material-symbols-outlined">person</span>
<span class="text-[10px] font-medium uppercase tracking-tight">Profile</span>
</button>
</nav>

</body></html>