{
  "brand": {
    "name": "Mod Syndicate",
    "attributes": [
      "bold",
      "classy",
      "high-performance",
      "premium",
      "street-racing energy",
      "precision-engineered",
      "Awwwards-grade motion polish"
    ],
    "visual_metaphors": [
      "carbon fiber weave (subtle texture)",
      "matte black body panels",
      "metallic/chrome edges",
      "neon underglow (crimson primary, electric blue secondary)",
      "speed lines + parallax depth",
      "gear-shift page transitions"
    ]
  },

  "design_tokens": {
    "notes": [
      "Dark mode by default. Do NOT use transparent card backgrounds; use solid dark surfaces.",
      "Neon accents are for focus/CTA/active states only; keep them sparse to preserve premium feel.",
      "Avoid large gradients; use small accent glows and thin light streaks."
    ],

    "css_custom_properties": {
      "how_to_apply": "Replace /app/frontend/src/index.css :root and .dark tokens with the following. Keep Tailwind + shadcn variable naming (HSL triplets). Add extra custom vars under :root for textures/glows.",
      "root": {
        "--background": "220 14% 6%",
        "--foreground": "210 20% 96%",

        "--card": "220 14% 9%",
        "--card-foreground": "210 20% 96%",

        "--popover": "220 14% 8%",
        "--popover-foreground": "210 20% 96%",

        "--primary": "0 84% 56%",
        "--primary-foreground": "0 0% 98%",

        "--secondary": "214 92% 58%",
        "--secondary-foreground": "0 0% 98%",

        "--muted": "220 12% 14%",
        "--muted-foreground": "215 12% 70%",

        "--accent": "220 12% 14%",
        "--accent-foreground": "210 20% 96%",

        "--destructive": "0 72% 46%",
        "--destructive-foreground": "0 0% 98%",

        "--border": "220 10% 18%",
        "--input": "220 10% 18%",
        "--ring": "0 84% 56%",

        "--radius": "0.75rem",

        "--ms-bg-0": "#07080B",
        "--ms-bg-1": "#0B0D12",
        "--ms-surface-0": "#0F1218",
        "--ms-surface-1": "#141824",
        "--ms-surface-2": "#191F2E",

        "--ms-text": "#E9EDF5",
        "--ms-text-muted": "#A7B0C2",
        "--ms-text-faint": "#7E879A",

        "--ms-chrome": "#C7CEDA",
        "--ms-chrome-dim": "#7F8796",

        "--ms-red": "#FF2A2A",
        "--ms-red-2": "#E60023",
        "--ms-blue": "#00A3FF",
        "--ms-blue-2": "#1E6BFF",

        "--ms-success": "#2EE59D",
        "--ms-warning": "#FFB020",

        "--ms-shadow": "0 18px 60px rgba(0,0,0,0.55)",
        "--ms-shadow-tight": "0 10px 30px rgba(0,0,0,0.55)",

        "--ms-glow-red": "0 0 0 1px rgba(255,42,42,0.35), 0 0 24px rgba(255,42,42,0.22)",
        "--ms-glow-blue": "0 0 0 1px rgba(0,163,255,0.35), 0 0 24px rgba(0,163,255,0.22)",

        "--ms-noise-opacity": "0.06",
        "--ms-carbon-opacity": "0.22",

        "--ms-focus": "0 0 0 2px rgba(0,0,0,0), 0 0 0 4px rgba(255,42,42,0.55)"
      },

      "recommended_global_css": {
        "body": "bg-[var(--ms-bg-0)] text-[var(--ms-text)]",
        "selection": "::selection { background: rgba(255,42,42,0.28); color: #fff; }",
        "focus": ":focus-visible { outline: none; box-shadow: var(--ms-focus); border-radius: 10px; }"
      }
    },

    "texture_and_backgrounds": {
      "rule": "Textures must be subtle and never reduce readability. Apply as overlays (pseudo-elements) on section wrappers, not on text blocks.",
      "carbon_fiber_overlay_css": "[data-carbon='true']{position:relative;} [data-carbon='true']::before{content:'';position:absolute;inset:0;background-image:url('https://images.pexels.com/photos/596815/pexels-photo-596815.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940');background-size:cover;background-position:center;opacity:var(--ms-carbon-opacity);mix-blend-mode:overlay;pointer-events:none;} [data-carbon='true']::after{content:'';position:absolute;inset:0;background-image:radial-gradient(circle at 20% 10%, rgba(0,163,255,0.10), transparent 55%), radial-gradient(circle at 80% 30%, rgba(255,42,42,0.10), transparent 55%);opacity:0.9;pointer-events:none;}",
      "noise_overlay_css": "[data-noise='true']{position:relative;} [data-noise='true']::after{content:'';position:absolute;inset:0;background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%220.35%22/%3E%3C/svg%3E');opacity:var(--ms-noise-opacity);mix-blend-mode:overlay;pointer-events:none;}",
      "allowed_gradients": {
        "usage": [
          "Hero background overlays only (max 20% viewport coverage)",
          "Decorative streaks behind headings", 
          "Large section dividers"
        ],
        "examples": [
          "background: radial-gradient(900px circle at 20% 10%, rgba(0,163,255,0.14), transparent 55%), radial-gradient(900px circle at 80% 30%, rgba(255,42,42,0.12), transparent 55%);",
          "background: linear-gradient(90deg, rgba(255,42,42,0.18), rgba(0,163,255,0.12)); (ONLY as a thin divider strip, 6–10px height)"
        ]
      }
    },

    "spacing_and_layout": {
      "spacing_scale_px": {
        "2": 8,
        "3": 12,
        "4": 16,
        "6": 24,
        "8": 32,
        "10": 40,
        "12": 48,
        "16": 64,
        "20": 80
      },
      "container": {
        "max_width": "max-w-7xl",
        "padding": "px-4 sm:px-6 lg:px-8",
        "section_padding": "py-14 sm:py-18 lg:py-24"
      },
      "grid": {
        "marketplace_grid": "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4",
        "dashboard_grid": "grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6",
        "dashboard_left": "lg:col-span-8",
        "dashboard_right": "lg:col-span-4"
      }
    },

    "radius_and_shadows": {
      "radius": {
        "card": "rounded-xl",
        "button": "rounded-lg",
        "pill": "rounded-full",
        "sheet_drawer": "rounded-t-2xl lg:rounded-2xl"
      },
      "shadows": {
        "surface": "shadow-[0_18px_60px_rgba(0,0,0,0.55)]",
        "tight": "shadow-[0_10px_30px_rgba(0,0,0,0.55)]",
        "glow_red": "shadow-[0_0_0_1px_rgba(255,42,42,0.35),0_0_24px_rgba(255,42,42,0.22)]",
        "glow_blue": "shadow-[0_0_0_1px_rgba(0,163,255,0.35),0_0_24px_rgba(0,163,255,0.22)]"
      }
    }
  },

  "typography": {
    "font_pairing": {
      "headings": {
        "primary": "Bebas Neue (Google Fonts)",
        "fallback": "Archivo Black",
        "usage": "All H1/H2 section titles, product titles, hero headline. Use tracking-wide and uppercase sparingly (hero only)."
      },
      "body": {
        "primary": "Inter (Google Fonts)",
        "fallback": "system-ui",
        "usage": "All paragraphs, labels, helper text, tables."
      },
      "mono": {
        "primary": "IBM Plex Mono",
        "usage": "VIN-like IDs, order numbers, receipt codes, spec tables (small)."
      }
    },
    "type_scale_tailwind": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-[800] tracking-tight",
      "h2": "text-2xl sm:text-3xl font-[750] tracking-tight",
      "h3": "text-xl sm:text-2xl font-[700]",
      "subheading": "text-base md:text-lg text-[color:var(--ms-text-muted)]",
      "body": "text-sm sm:text-base leading-relaxed text-[color:var(--ms-text)]",
      "small": "text-xs sm:text-sm text-[color:var(--ms-text-muted)]"
    },
    "heading_style_rules": [
      "Use Bebas Neue with tracking-[0.06em] for hero H1 only.",
      "Avoid long all-caps paragraphs; keep body in sentence case.",
      "Use subtle chrome divider under section headings (2px height)."
    ]
  },

  "component_path": {
    "shadcn_primary": [
      "/app/frontend/src/components/ui/button.jsx",
      "/app/frontend/src/components/ui/card.jsx",
      "/app/frontend/src/components/ui/dialog.jsx",
      "/app/frontend/src/components/ui/drawer.jsx",
      "/app/frontend/src/components/ui/sheet.jsx",
      "/app/frontend/src/components/ui/tabs.jsx",
      "/app/frontend/src/components/ui/badge.jsx",
      "/app/frontend/src/components/ui/input.jsx",
      "/app/frontend/src/components/ui/textarea.jsx",
      "/app/frontend/src/components/ui/select.jsx",
      "/app/frontend/src/components/ui/slider.jsx",
      "/app/frontend/src/components/ui/checkbox.jsx",
      "/app/frontend/src/components/ui/calendar.jsx",
      "/app/frontend/src/components/ui/carousel.jsx",
      "/app/frontend/src/components/ui/scroll-area.jsx",
      "/app/frontend/src/components/ui/separator.jsx",
      "/app/frontend/src/components/ui/sonner.jsx"
    ],
    "recommended_new_components_to_create": [
      "/app/frontend/src/components/ms/TopNav.jsx",
      "/app/frontend/src/components/ms/HeroVideo.jsx",
      "/app/frontend/src/components/ms/NeonDivider.jsx",
      "/app/frontend/src/components/ms/ProductCard.jsx",
      "/app/frontend/src/components/ms/FilterRail.jsx",
      "/app/frontend/src/components/ms/MasonryFeed.jsx",
      "/app/frontend/src/components/ms/GearShiftTransition.jsx",
      "/app/frontend/src/components/ms/GarageCarTile.jsx",
      "/app/frontend/src/components/ms/BookingDrawer.jsx"
    ]
  },

  "components": {
    "buttons": {
      "variants": {
        "primary": {
          "intent": "Primary CTA (Add to Garage, Checkout, Book Install)",
          "tailwind": "bg-[var(--ms-red)] text-white hover:bg-[var(--ms-red-2)] focus-visible:shadow-[var(--ms-glow-red)]",
          "micro_interaction": "On hover: add a fast 'metallic sweep' pseudo-element + slight translateY(-1px). On press: scale-95.",
          "data_testid_examples": [
            "data-testid=\"primary-cta-button\"",
            "data-testid=\"add-to-garage-button\""
          ]
        },
        "secondary": {
          "intent": "Secondary CTA (View Details, Explore Community)",
          "tailwind": "bg-[var(--ms-surface-1)] text-[var(--ms-text)] border border-[hsl(var(--border))] hover:border-[rgba(0,163,255,0.55)] hover:shadow-[var(--ms-glow-blue)]",
          "micro_interaction": "Hover: border glow blue + subtle sheen."
        },
        "ghost": {
          "intent": "Nav actions, subtle actions",
          "tailwind": "bg-transparent text-[var(--ms-text)] hover:bg-[rgba(255,255,255,0.06)]"
        }
      },
      "sizes": {
        "sm": "h-9 px-3 text-sm",
        "md": "h-11 px-4 text-sm",
        "lg": "h-12 px-5 text-base"
      },
      "metallic_sheen_css": ".ms-sheen{position:relative;overflow:hidden;} .ms-sheen::after{content:'';position:absolute;inset:-40% -60%;background:linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.18) 45%, transparent 55%);transform:translateX(-30%);opacity:0;transition:opacity 180ms ease, transform 420ms cubic-bezier(.2,.9,.2,1);} .ms-sheen:hover::after{opacity:1;transform:translateX(30%);}"
    },

    "cards": {
      "base": "rounded-xl bg-[var(--ms-surface-0)] border border-[rgba(255,255,255,0.06)] shadow-[var(--ms-shadow-tight)]",
      "hover": "hover:border-[rgba(255,42,42,0.35)] hover:shadow-[var(--ms-glow-red)]",
      "product_card_pattern": {
        "structure": [
          "Top: image (AspectRatio 4/3) with parallax hover",
          "Middle: title + fitment badges",
          "Bottom: price + quick actions (Add to Garage) revealed on hover"
        ],
        "hover_reveal": "Use group-hover to slide in action row from bottom with opacity transition (no transition:all).",
        "data_testid_examples": [
          "data-testid=\"product-card\"",
          "data-testid=\"product-card-add-to-garage\""
        ]
      }
    },

    "navigation": {
      "top_nav": {
        "requirements": [
          "Marketplace + Community always visible (logged in/out).",
          "Auth-aware CTA: Login/Signup OR My Garage + Dashboard.",
          "Sticky with blur is NOT allowed if it becomes transparent; keep solid dark surface."
        ],
        "tailwind": "sticky top-0 z-50 bg-[rgba(11,13,18,0.96)] border-b border-[rgba(255,255,255,0.06)]",
        "layout": "Left: logo + primary links. Right: search, cart/garage, auth button.",
        "data_testid_examples": [
          "data-testid=\"top-nav\"",
          "data-testid=\"nav-marketplace-link\"",
          "data-testid=\"nav-community-link\"",
          "data-testid=\"nav-login-button\"",
          "data-testid=\"nav-my-garage-link\""
        ]
      }
    },

    "modals_drawers": {
      "auth_modal": {
        "component": "Dialog (shadcn)",
        "behavior": [
          "Trap focus, ESC closes, overlay click closes.",
          "Tabs for Login/Signup.",
          "If unauth user clicks Add to Garage => open modal and preserve intended action in state."
        ],
        "data_testid_examples": [
          "data-testid=\"auth-modal\"",
          "data-testid=\"auth-email-input\"",
          "data-testid=\"auth-password-input\"",
          "data-testid=\"auth-submit-button\""
        ]
      },
      "booking_flow": {
        "component": "Drawer or Sheet (mobile-first)",
        "steps": [
          "1) Calendar",
          "2) Review",
          "3) MOCK payment",
          "4) Receipt"
        ],
        "calendar": "Use shadcn Calendar component.",
        "data_testid_examples": [
          "data-testid=\"booking-drawer\"",
          "data-testid=\"booking-calendar\"",
          "data-testid=\"booking-review-continue\"",
          "data-testid=\"booking-mock-pay-button\"",
          "data-testid=\"booking-receipt\""
        ]
      }
    },

    "forms": {
      "style": "Inputs are solid dark with chrome border; focus ring uses red glow.",
      "input_tailwind": "bg-[var(--ms-surface-0)] border border-[rgba(255,255,255,0.10)] text-[var(--ms-text)] placeholder:text-[var(--ms-text-faint)] focus-visible:border-[rgba(255,42,42,0.55)] focus-visible:shadow-[var(--ms-glow-red)]",
      "helper_text": "text-xs text-[var(--ms-text-muted)]",
      "error_text": "text-xs text-[var(--ms-red)]"
    },

    "badges": {
      "fitment": "Badge with chrome border + faint blue glow for 'Verified Fitment'.",
      "sale": "Badge solid red with subtle sheen.",
      "tailwind_examples": {
        "verified": "border border-[rgba(0,163,255,0.45)] text-[var(--ms-blue)] bg-[rgba(0,163,255,0.08)]",
        "sale": "bg-[rgba(255,42,42,0.16)] text-[var(--ms-red)] border border-[rgba(255,42,42,0.35)]"
      }
    },

    "tables_and_specs": {
      "component": "Table (shadcn)",
      "style": "Use zebra rows with very subtle contrast; spec keys in muted text; values in foreground.",
      "tailwind": "bg-[var(--ms-surface-0)] border border-[rgba(255,255,255,0.06)]"
    },

    "toasts": {
      "library": "sonner",
      "usage": "Use for Add to Garage success, login required, booking confirmed.",
      "data_testid": "Add data-testid on toast trigger buttons; toast itself can include role=alert."
    }
  },

  "motion": {
    "libraries": {
      "required": ["framer-motion", "lenis"],
      "optional": ["react-intersection-observer"],
      "install": "npm i framer-motion lenis react-intersection-observer"
    },
    "principles": [
      "Motion should feel like performance engineering: quick, decisive, no bouncy cartoon easing.",
      "Use staggered reveals for grids; keep durations short.",
      "Respect prefers-reduced-motion: disable parallax + reduce durations."
    ],
    "durations_ms": {
      "micro": 140,
      "fast": 220,
      "base": 320,
      "slow": 520
    },
    "easings": {
      "gear_shift": "cubic-bezier(0.22, 1, 0.36, 1)",
      "sheen": "cubic-bezier(0.2, 0.9, 0.2, 1)",
      "snap": "cubic-bezier(0.3, 1, 0.3, 1)"
    },
    "page_transitions": {
      "concept": "Gear-shift: quick exit (slight blur + translate), then enter with crisp snap.",
      "framer_variant": {
        "initial": "{ opacity: 0, y: 14, filter: 'blur(6px)' }",
        "animate": "{ opacity: 1, y: 0, filter: 'blur(0px)' }",
        "exit": "{ opacity: 0, y: -10, filter: 'blur(8px)' }",
        "transition": "{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }"
      }
    },
    "parallax": {
      "hero_image_depth": {
        "background": "translateY: 18px over scroll range",
        "foreground": "translateY: -10px over scroll range"
      },
      "section_dividers": "Use NeonDivider with slight horizontal drift (6–12px) tied to scroll.",
      "hover_parallax": "On product cards: image translateY(-6px) + scale(1.03) on hover."
    },
    "layered_reveal_my_garage": {
      "pattern": [
        "Layer 1: car image fades in",
        "Layer 2: chrome outline draws (stroke animation)",
        "Layer 3: actions slide up",
        "Layer 4: spec chips pop in stagger"
      ],
      "stagger": "0.06s between children"
    }
  },

  "page_level_layout_sketches": {
    "home_public": {
      "hero": [
        "Full-screen hero with background video (fallback image).",
        "Left-aligned headline + subheading + 2 CTAs (Primary red, Secondary blue-outline).",
        "Right/bottom: floating spec chips (e.g., 'Wraps', 'ECU', 'Alloys') with subtle drift.",
        "Add a thin NeonDivider below hero (6–10px height)."
      ],
      "services": "3–6 cards in a bento grid: Wraps, Performance, Wheels, Lighting, Interiors, Detailing.",
      "process": "Timeline/steps with gear-like step indicators; use Accordion for details.",
      "featured_reviews": "Carousel with dramatic photos + rating + quote.",
      "enter_garage_cta": "Full-width card (solid surface) with red glow edge; CTA opens auth modal if logged out.",
      "footer_contact": "Solid dark footer with contact form (Input/Textarea) + social links."
    },

    "marketplace": {
      "top": "Sticky filter rail (Sheet on mobile) + search + sort.",
      "grid": "Filterable product grid; hover reveals Add to Garage.",
      "gated_action": "If unauthenticated: clicking Add to Garage opens Login modal and stores pending productId.",
      "empty_state": "Use Skeleton + a strong empty message with a blue accent line and a 'Clear filters' button."
    },

    "product_detail": {
      "layout": "Mobile: stacked. Desktop: 2-column (gallery left, purchase panel right).",
      "gallery": "Carousel + thumbnails; allow zoom (optional).",
      "purchase_panel": "Price, fitment badges, quantity, Add to Garage, Buy Now, Install With Us.",
      "specs": "Tabs: Overview / Specs / Fitment / Reviews.",
      "trust": "Add 'Verified Install Partners' strip with chrome icons."
    },

    "community": {
      "tabs": "Tabs: Builds (masonry), Events (calendar+list), Reviews (editorial cards).",
      "builds_feed": "MasonryFeed with image-first cards; hover shows author + likes + 'Save Build'.",
      "events": "Calendar (shadcn) + list; event cards with blue accent.",
      "reviews": "Magazine layout: large featured review + smaller side cards."
    },

    "auth": {
      "modal_first": "Prefer modal from any page; also provide /auth route fallback with same component.",
      "layout": "Split panel: left brand/benefits, right form. Keep solid surfaces."
    },

    "onboarding_authed": {
      "goal": "Capture car profile (model, year, mods interest, city).",
      "layout": "Single column, max-w-xl, with progress indicator.",
      "components": "Form (shadcn), Select, Checkbox, Input."
    },

    "dashboard_authed": {
      "layout": [
        "Top: car summary card (image + key stats).",
        "Left: Active booking + next steps.",
        "Right: Booking history list + quick actions.",
        "Bottom: recommended products carousel."
      ]
    },

    "my_garage_authed": {
      "layout": "Visual list/grid of saved products + installed mods.",
      "animations": "Layered reveal on entry; hover shows Buy Now / Install With Us.",
      "states": "Tabs: Saved / Installed / Wishlist."
    },

    "booking_flow_authed": {
      "container": "Drawer (mobile) / Sheet (desktop).",
      "steps": "Calendar -> Review -> MOCK Payment -> Receipt.",
      "receipt": "Use mono font for receipt id; include 'Add to Calendar' button."
    },

    "profile_settings": {
      "layout": "Simple cards: account, password, notifications, logout.",
      "security": "Show JWT session status subtly; provide 'Sign out all devices' (future)."
    }
  },

  "image_urls": {
    "textures": [
      {
        "category": "carbon_fiber_overlay",
        "description": "Use as subtle overlay on hero + section wrappers (opacity <= 0.22).",
        "url": "https://images.pexels.com/photos/596815/pexels-photo-596815.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      }
    ],
    "hero": [
      {
        "category": "hero_fallback_image_hyundai_i20_theme",
        "description": "Fallback image if video fails; also use for hero poster.",
        "url": "https://images.pexels.com/photos/5199490/pexels-photo-5199490.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      },
      {
        "category": "hero_city_night_motion",
        "description": "Use as secondary hero layer / parallax background for speed vibe.",
        "url": "https://images.pexels.com/photos/9692671/pexels-photo-9692671.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      }
    ],
    "garage_thar_theme": [
      {
        "category": "modified_thar_placeholder",
        "description": "Rugged modified SUV vibe placeholder for Thar-themed sections.",
        "url": "https://images.pexels.com/photos/18263504/pexels-photo-18263504.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      },
      {
        "category": "offroad_closeup",
        "description": "Use for community builds / events hero cards.",
        "url": "https://images.pexels.com/photos/27517023/pexels-photo-27517023.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      }
    ],
    "marketplace_placeholders": [
      {
        "category": "product_placeholder_1",
        "description": "Generic dramatic car shot for product cards until real product images exist.",
        "url": "https://images.unsplash.com/photo-1579782647395-2e6fb36a64f2?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "product_placeholder_2",
        "description": "Night street vibe for product detail gallery placeholder.",
        "url": "https://images.unsplash.com/photo-1715734040880-19a89122c52b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
      }
    ]
  },

  "instructions_to_main_agent": {
    "global": [
      "Remove centered layout defaults from /app/frontend/src/App.css (do not use .App { text-align:center }).",
      "Set dark mode by default by applying className='dark' on the html/body root (or Tailwind dark strategy).",
      "Replace shadcn tokens in /app/frontend/src/index.css with the provided HSL values and add ms-* custom vars.",
      "Add carbon/noise overlays via data attributes on section wrappers: data-carbon='true' data-noise='true'.",
      "All interactive + key informational elements MUST include data-testid in kebab-case."
    ],
    "navigation_and_auth_logic": [
      "TopNav must always show Marketplace + Community links.",
      "Marketplace 'Add to Garage' click: if !auth => open AuthModal (Dialog) and store pending action; after login, replay action.",
      "Provide /auth route fallback that renders the same Auth component (for deep links)."
    ],
    "motion_implementation": [
      "Use Lenis for smooth scrolling (single instance at app root).",
      "Use Framer Motion for page transitions (GearShiftTransition wrapper keyed by route).",
      "Use IntersectionObserver (react-intersection-observer) for staggered reveals and My Garage layered animations.",
      "Respect prefers-reduced-motion: disable parallax and reduce durations."
    ],
    "component_build_notes_js": [
      "Project uses .js (not .tsx). Write components in React .jsx/.js with PropTypes optional.",
      "Use shadcn components from /app/frontend/src/components/ui/* as primitives; do not use raw HTML dropdown/calendar/toast.",
      "Use lucide-react icons (already typical with shadcn) or FontAwesome CDN; no emoji icons."
    ],
    "mocked_integrations": [
      "Payment flow is MOCKED: show a realistic card form UI but do not process payments.",
      "Booking receipt generation can be client-side mocked until backend endpoints exist."
    ]
  },

  "accessibility": {
    "rules": [
      "Maintain AA contrast: body text should be off-white on charcoal; avoid neon text for paragraphs.",
      "Focus states must be visible on dark surfaces (use red glow ring).",
      "Keyboard navigation: Dialog/Drawer must trap focus; ESC closes.",
      "Reduce motion: honor prefers-reduced-motion by disabling parallax and using opacity-only transitions."
    ]
  },

  "General UI UX Design Guidelines": [
    "- You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms",
    "- You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text",
    "- NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json",
    "\n **GRADIENT RESTRICTION RULE**",
    "NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc",
    "NEVER use dark gradients for logo, testimonial, footer etc",
    "NEVER let gradients cover more than 20% of the viewport.",
    "NEVER apply gradients to text-heavy content or reading areas.",
    "NEVER use gradients on small UI elements (<100px width).",
    "NEVER stack multiple gradient layers in the same viewport.",
    "\n**ENFORCEMENT RULE:**",
    "    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors",
    "\n**How and where to use:**",
    "   • Section backgrounds (not content backgrounds)",
    "   • Hero section header content. Eg: dark to light to dark color",
    "   • Decorative overlays and accent elements only",
    "   • Hero section with 2-3 mild color",
    "   • Gradients creation can be done for any angle say horizontal, vertical or diagonal",
    "\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**",
    "\n</Font Guidelines>",
    "\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead.",
    "   ",
    "- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.",
    "\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.",
    "   ",
    "- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly",
    "    Eg: - if it implies playful/energetic, choose a colorful scheme",
    "           - if it implies monochrome/minimal, choose a black–white/neutral scheme",
    "\n**Component Reuse:**",
    "\t- Prioritize using pre-existing components from src/components/ui when applicable",
    "\t- Create new components that match the style and conventions of existing components when needed",
    "\t- Examine existing components to understand the project's component patterns before creating new ones",
    "\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component",
    "\n**Best Practices:**",
    "\t- Use Shadcn/UI as the primary component library for consistency and accessibility",
    "\t- Import path: ./components/[component-name]",
    "\n**Export Conventions:**",
    "\t- Components MUST use named exports (export const ComponentName = ...)",
    "\t- Pages MUST use default exports (export default function PageName() {...})",
    "\n**Toasts:**",
    "  - Use `sonner` for toasts\"",
    "  - Sonner component are located in `/app/src/components/ui/sonner.tsx`",
    "\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals."
  ]
}
