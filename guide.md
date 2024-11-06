# Compra Landing Page Technical Specification
Version 2.0

## 1. Technical Stack & Requirements

### 1.1 Core Technologies
- Next.js 14+ with App Router
  - Server Components as default
  - Client Components where necessary (interactive elements)
  - React Server Actions for form handling
- TypeScript 5.0+
  - Strict mode enabled
  - Custom type definitions for all components
- Tailwind CSS 3.0+
  - Custom configuration with design tokens
  - JIT (Just-In-Time) compilation
  - Custom plugin support
- Edge Runtime Support
  - Vercel Edge Functions
  - Global CDN distribution

### 1.2 Performance Targets
- Lighthouse Score Requirements:
  - Performance: 95+
  - Accessibility: 100
  - Best Practices: 95+
  - SEO: 100
- Core Web Vitals Targets:
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1
  - TTI (Time to Interactive): < 3.5s
  - FCP (First Contentful Paint): < 1.5s
  - TTFB (Time to First Byte): < 0.8s

### 1.3 Browser Support
- Chrome (latest 2 versions)
  - Windows
  - macOS
  - Android
- Firefox (latest 2 versions)
  - Windows
  - macOS
  - Android
- Safari (latest 2 versions)
  - macOS
  - iOS
- Edge (latest 2 versions)
  - Windows
  - macOS
- Mobile browsers
  - iOS Safari 14+
  - Chrome for Android 90+
  - Samsung Internet 14+

## 2. Design System

### 2.1 Brand Identity

#### 2.1.1 Logo Specifications
- Primary Logo
  - Dimensions: 180x40px
  - Format: SVG (scalable)
  - Clear space: 16px minimum all sides
  - Dark version: #1a1a1a
  - Light version: #ffffff
  - Favicon: 32x32px, 16x16px versions

#### 2.1.2 Color System
```css
/* Primary Color Scale */
--primary-900: #1a1a1a;     /* Deep Black - Headers, Important Text */
--primary-800: #2c2c2c;     /* Soft Black - Subheaders */
--primary-700: #333333;     /* Dark Gray - Body Text */
--primary-600: #4a4a4a;     /* Medium Gray - Secondary Text */
--primary-500: #666666;     /* Light Gray - Disabled Text */
--primary-400: #808080;     /* Lighter Gray - Borders */
--primary-300: #cccccc;     /* Very Light Gray - Dividers */
--primary-200: #e6e6e6;     /* Almost White - Background Accents */
--primary-100: #f5f5f5;     /* Off White - Main Background */

/* Accent Colors */
--accent-900: #1e40af;      /* Darkest Blue - Pressed States */
--accent-800: #1d4ed8;      /* Darker Blue - Active States */
--accent-700: #2563eb;      /* Dark Blue - Hover States */
--accent-600: #3b82f6;      /* Brand Blue - Primary CTAs */
--accent-500: #60a5fa;      /* Medium Blue - Secondary Actions */
--accent-400: #93c5fd;      /* Light Blue - Decorative Elements */
--accent-300: #bfdbfe;      /* Lighter Blue - Backgrounds */
--accent-200: #dbeafe;      /* Lightest Blue - Subtle Backgrounds */
--accent-100: #eff6ff;      /* Ultra Light Blue - Hover Backgrounds */

/* Feedback Colors */
--success-700: #15803d;     /* Dark Success - Hover */
--success-600: #16a34a;     /* Medium Success - Default */
--success-500: #22c55e;     /* Light Success - Background */

--error-700: #b91c1c;       /* Dark Error - Hover */
--error-600: #dc2626;       /* Medium Error - Default */
--error-500: #ef4444;       /* Light Error - Background */

--warning-700: #b45309;     /* Dark Warning - Hover */
--warning-600: #d97706;     /* Medium Warning - Default */
--warning-500: #f59e0b;     /* Light Warning - Background */

/* Gradient Definitions */
--gradient-primary: linear-gradient(135deg, var(--accent-600) 0%, var(--accent-400) 100%);
--gradient-dark: linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%);
--gradient-light: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
```

#### 2.1.3 Shadow System
```css
/* Box Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

/* Drop Shadows */
--drop-shadow-sm: drop-shadow(0 1px 1px rgb(0 0 0 / 0.05));
--drop-shadow-md: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));
--drop-shadow-lg: drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1));
```

### 2.2 Typography

#### 2.2.1 Font Families
```css
/* Primary Font - Inter */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Secondary Font - Outfit */
--font-secondary: 'Outfit', Georgia, serif;

/* Monospace - For code blocks */
--font-mono: 'JetBrains Mono', ui-monospace, monospace;
```

#### 2.2.2 Type Scale
```css
/* Core Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
--text-6xl: 3.75rem;     /* 60px */

/* Line Heights */
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;

/* Letter Spacing */
--tracking-tighter: -0.05em;
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;
--tracking-widest: 0.1em;

/* Font Weights */
--font-thin: 100;
--font-extralight: 200;
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
--font-black: 900;
```

### 2.3 Spacing System

#### 2.3.1 Core Spacing
```css
/* Base Spacing Units */
--spacing-px: 1px;
--spacing-0: 0;
--spacing-0.5: 0.125rem;  /* 2px */
--spacing-1: 0.25rem;     /* 4px */
--spacing-1.5: 0.375rem;  /* 6px */
--spacing-2: 0.5rem;      /* 8px */
--spacing-2.5: 0.625rem;  /* 10px */
--spacing-3: 0.75rem;     /* 12px */
--spacing-3.5: 0.875rem;  /* 14px */
--spacing-4: 1rem;        /* 16px */
--spacing-5: 1.25rem;     /* 20px */
--spacing-6: 1.5rem;      /* 24px */
--spacing-7: 1.75rem;     /* 28px */
--spacing-8: 2rem;        /* 32px */
--spacing-9: 2.25rem;     /* 36px */
--spacing-10: 2.5rem;     /* 40px */
--spacing-11: 2.75rem;    /* 44px */
--spacing-12: 3rem;       /* 48px */
--spacing-14: 3.5rem;     /* 56px */
--spacing-16: 4rem;       /* 64px */
--spacing-20: 5rem;       /* 80px */
--spacing-24: 6rem;       /* 96px */
--spacing-28: 7rem;       /* 112px */
--spacing-32: 8rem;       /* 128px */
--spacing-36: 9rem;       /* 144px */
--spacing-40: 10rem;      /* 160px */
--spacing-44: 11rem;      /* 176px */
--spacing-48: 12rem;      /* 192px */
--spacing-52: 13rem;      /* 208px */
--spacing-56: 14rem;      /* 224px */
--spacing-60: 15rem;      /* 240px */
--spacing-64: 16rem;      /* 256px */
--spacing-72: 18rem;      /* 288px */
--spacing-80: 20rem;      /* 320px */
--spacing-96: 24rem;      /* 384px */
```

#### 2.3.2 Layout Spacing
```css
/* Container Widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;

/* Grid System */
--grid-cols-1: repeat(1, minmax(0, 1fr));
--grid-cols-2: repeat(2, minmax(0, 1fr));
--grid-cols-3: repeat(3, minmax(0, 1fr));
--grid-cols-4: repeat(4, minmax(0, 1fr));
--grid-cols-5: repeat(5, minmax(0, 1fr));
--grid-cols-6: repeat(6, minmax(0, 1fr));
--grid-cols-12: repeat(12, minmax(0, 1fr));

/* Grid Gaps */
--gap-0: 0;
--gap-1: 0.25rem;
--gap-2: 0.5rem;
--gap-4: 1rem;
--gap-6: 1.5rem;
--gap-8: 2rem;
--gap-12: 3rem;
--gap-16: 4rem;
```

## 3. Component Architecture

### 3.1 Layout Components

#### 3.1.1 Root Layout
```typescript
// app/layout.tsx
interface RootLayoutProps {
  children: React.ReactNode;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
}

const defaultMetadata = {
  title: 'Compra - AI-Powered Surveys for Shopify',
  description: 'Create targeted surveys and gather customer feedback with Compra's powerful survey platform.',
  keywords: ['shopify surveys', 'customer feedback', 'ecommerce surveys'],
  ogImage: '/images/og-image.jpg'
};
```

#### 3.1.2 Header Component
```typescript
// components/layout/Header.tsx
interface HeaderProps {
  transparent?: boolean;
  sticky?: boolean;
  variant?: 'light' | 'dark';
  showNav?: boolean;
  className?: string;
}

interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavigationItem[];
}

interface HeaderStyleProps {
  transparent: boolean;
  sticky: boolean;
  variant: 'light' | 'dark';
  isScrolled: boolean;
}

const headerStyles = {
  base: 'w-full z-50 transition-all duration-300',
  transparent: {
    light: 'bg-transparent text-primary-900',
    dark: 'bg-transparent text-white'
  },
  solid: {
    light: 'bg-white text-primary-900 shadow-md',
    dark: 'bg-primary-900 text-white'
  },
  sticky: 'sticky top-0',
  container: 'container mx-auto px-4 py-4 md:py-6',
  logo: 'h-8 md:h-10 w-auto',
  nav: 'hidden md:flex items-center space-x-8',
  navItem: 'font-medium hover:text-accent-600 transition-colors',
  button: 'ml-8'
};
```

#### 3.1.3 Footer Component
```typescript
// components/layout/Footer.tsx
interface FooterProps {
  simplified?: boolean;
  className?: string;
  showNewsletter?: boolean;
}

interface FooterSection {
  title: string;
  links: {
    label: string;
    href: string;
    external?: boolean;
  }[];
}

interface SocialLink {
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  href: string;
  icon: React.ReactNode;
}

const footerStyles = {
  wrapper: 'bg-primary-900 text-white',
  container: 'container mx-auto px-4 py-12 md:py-16',
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8',
  section: 'space-y-4',
  title: 'font-semibold text-lg',
  link: 'block text-primary-300 hover:text-white transition-colors',
  newsletter: 'mt-12 border-t border-primary-700 pt-12',
  social: {
    wrapper: 'flex space-x-6 mt-8',
    icon: 'h-6 w-6 text-primary-300 hover:text-white transition-colors'
  },
  simplified: {
    wrapper: 'bg-primary-900 text-white py-8',
    container: 'container mx-auto px-4 flex flex-col md:flex-row justify-between items-center',
    copyright: 'text-sm text-primary-300 text-center md:text-left'
  }
};
```

### 3.2 Section Components

#### 3.2.1 Hero Section
```typescript
// components/sections/Hero.tsx
interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  backgroundVariant?: 'gradient' | 'image' | 'video';
  className?: string;
}

interface HeroStyles {
  wrapper: string;
  container: string;
  content: string;
  title: string;
  subtitle: string;
  ctaGroup: string;
  primaryCta: string;
  secondaryCta: string;
  backgroundVariants: {
    gradient: string;
    image: string;
    video: string;
  };
}

const heroStyles: HeroStyles = {
  wrapper: 'relative min-h-[90vh] flex items-center',
  container: 'container mx-auto px-4 py-20 relative z-10',
  content: 'max-w-3xl mx-auto text-center',
  title: 'text-4xl md:text-6xl font-bold font-secondary tracking-tight',
  subtitle: 'mt-6 text-xl md:text-2xl text-primary-600 max-w-2xl mx-auto',
  ctaGroup: 'mt-10 flex flex-col sm:flex-row justify-center gap-4',
  primaryCta: 'btn-primary px-8 py-4 text-lg',
  secondaryCta: 'btn-secondary px-8 py-4 text-lg',
  backgroundVariants: {
    gradient: 'bg-gradient-to-br from-accent-100 to-primary-100',
    image: 'bg-cover bg-center bg-no-repeat',
    video: 'relative overflow-hidden'
  }
};
```

#### 3.2.2 Features Section
```typescript
// components/sections/Features.tsx
interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: {
    text: string;
    url: string;
  };
}

interface FeaturesProps {
  title: string;
  subtitle?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
  variant?: 'cards' | 'minimal' | 'horizontal';
  className?: string;
}

interface FeatureCardProps extends Feature {
  variant: FeaturesProps['variant'];
  className?: string;
}

const featureStyles = {
  section: 'py-20 bg-white',
  container: 'container mx-auto px-4',
  header: {
    wrapper: 'text-center max-w-3xl mx-auto mb-16',
    title: 'text-3xl md:text-4xl font-bold font-secondary',
    subtitle: 'mt-4 text-lg text-primary-600'
  },
  grid: {
    2: 'grid grid-cols-1 md:grid-cols-2 gap-8',
    3: 'grid grid-cols-1 md:grid-cols-3 gap-8',
    4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'
  },
  card: {
    wrapper: 'relative p-6 rounded-2xl transition-all duration-300',
    variants: {
      cards: 'bg-white shadow-lg hover:shadow-xl',
      minimal: 'hover:bg-primary-50',
      horizontal: 'flex items-start gap-6'
    },
    icon: 'h-12 w-12 text-accent-600 mb-4',
    title: 'text-xl font-semibold mb-2',
    description: 'text-primary-600',
    link: 'mt-4 inline-flex items-center text-accent-600 hover:text-accent-700 font-medium'
  }
};
```

#### 3.2.3 Integration Section
```typescript
// components/sections/Integration.tsx
interface IntegrationProps {
  shopifyConnect: boolean;
  steps: IntegrationStep[];
  className?: string;
}

interface IntegrationStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  image?: {
    src: string;
    alt: string;
  };
}

const integrationStyles = {
  section: 'py-20 bg-gradient-to-br from-primary-50 to-accent-50',
  container: 'container mx-auto px-4',
  header: {
    wrapper: 'text-center max-w-3xl mx-auto mb-16',
    title: 'text-3xl md:text-4xl font-bold font-secondary',
    subtitle: 'mt-4 text-lg text-primary-600'
  },
  steps: {
    wrapper: 'relative',
    timeline: 'absolute left-1/2 -translate-x-1/2 h-full w-px bg-accent-200',
    grid: 'grid gap-12',
    step: {
      wrapper: 'relative flex items-center gap-8',
      icon: 'relative z-10 flex-shrink-0 w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-accent-600',
      content: {
        wrapper: 'flex-1',
        title: 'text-xl font-semibold mb-2',
        description: 'text-primary-600'
      },
      image: 'rounded-lg shadow-lg max-w-md'
    }
  }
};
```

#### 3.2.4 Social Proof Section
```typescript
// components/sections/SocialProof.tsx
interface Statistic {
  value: string | number;
  label: string;
  prefix?: string;
  suffix?: string;
}

interface Brand {
  name: string;
  logo: {
    light: string;
    dark: string;
  };
}

interface SocialProofProps {
  statistics: Statistic[];
  brands: Brand[];
  variant?: 'light' | 'dark';
  animated?: boolean;
  className?: string;
}

const socialProofStyles = {
  section: 'py-20',
  container: 'container mx-auto px-4',
  variants: {
    light: 'bg-white',
    dark: 'bg-primary-900 text-white'
  },
  statistics: {
    grid: 'grid grid-cols-2 md:grid-cols-4 gap-8 mb-16',
    item: {
      wrapper: 'text-center',
      value: 'text-3xl md:text-4xl font-bold font-secondary',
      label: 'mt-2 text-primary-600 dark:text-primary-300'
    }
  },
  brands: {
    wrapper: 'mt-16',
    grid: 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center',
    logo: {
      wrapper: 'flex justify-center',
      image: 'h-8 md:h-10 object-contain filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300'
    }
  }
};
```

### 3.3 Common Components

#### 3.3.1 Button Component
```typescript
// components/common/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  href?: string;
  className?: string;
}

const buttonStyles = {
  base: 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2',
  variants: {
    primary: 'bg-accent-600 text-white hover:bg-accent-700 focus:ring-accent-600',
    secondary: 'bg-primary-900 text-white hover:bg-primary-800 focus:ring-primary-900',
    outline: 'border-2 border-current text-accent-600 hover:bg-accent-50',
    ghost: 'text-primary-600 hover:bg-primary-50'
  },
  sizes: {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  },
  iconWrapper: {
    left: 'mr-2',
    right: 'ml-2'
  },
  loading: 'opacity-75 cursor-not-allowed',
  fullWidth: 'w-full',
  icon: 'h-5 w-5'
};
```

#### 3.3.2 Card Component
```typescript
// components/common/Card.tsx
interface CardProps {
  variant?: 'default' | 'hover' | 'interactive';
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  className?: string;
  children: React.ReactNode;
}

const cardStyles = {
  base: 'rounded-2xl overflow-hidden bg-white',
  variants: {
    default: '',
    hover: 'transition-all duration-300 hover:shadow-lg',
    interactive: 'cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1'
  },
  padding: {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  },
  shadow: {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  },
  border: 'border border-primary-200'
};
```

#### 3.3.3 Input Component
```typescript
// components/common/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'filled' | 'outline';
  className?: string;
}

const inputStyles = {
  wrapper: 'relative',
  label: 'block text-sm font-medium text-primary-700 mb-1',
  base: 'w-full rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
  variants: {
    default: 'border border-primary-300 focus:border-accent-600 focus:ring-accent-600',
    filled: 'bg-primary-100 border-2 border-transparent focus:bg-white focus:border-accent-600 focus:ring-accent-600',
    outline: 'bg-transparent border-2 border-primary-300 focus:border-accent-600 focus:ring-accent-600'
  },
  sizes: {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-5 py-3 text-lg'
  },
  icon: {
    wrapper: 'absolute inset-y-0 flex items-center',
    left: 'left-3',
    right: 'right-3',
    size: 'h-5 w-5 text-primary-400'
  },
  helper: 'mt-1 text-sm text-primary-500',
  error: 'mt-1 text-sm text-error-600',
  disabled: 'opacity-50 cursor-not-allowed'
};
```

## 4. Animation System

### 4.1 Transition Definitions
```typescript
// utils/animations.ts
interface TransitionConfig {
  property: string;
  duration: number;
  timing: string;
  delay?: number;
}

const transitions = {
  default: {
    property: 'all',
    duration: 300,
    timing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  smooth: {
    property: 'all',
    duration: 500,
    timing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  slow: {
    property: 'all',
    duration: 700,
    timing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  bounce: {
    property: 'all',
    duration: 500,
    timing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  }
};
```

### 4.2 Scroll Animations
```typescript
// utils/scrollAnimations.ts
interface ScrollAnimationConfig {
  initial: object;
  animate: object;
  viewport?: object;
  transition?: object;
}

const scrollAnimations = {
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-100px' },
    transition: { duration: 0.5 }
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    viewport: { once: true },
    transition: { duration: 0.5 }
  },
  scaleUp: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    viewport: { once: true },
    transition: { duration: 0.5 }
  },
  slideInLeft: {
    initial: { x: -50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    viewport: { once: true },
    transition: { duration: 0.5 }
  },
  slideInRight: {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    viewport: { once: true },
    transition: { duration: 0.5 }
  }
};
```

### 4.3 Micro-interactions
```typescript
// utils/microInteractions.ts
interface MicroInteractionConfig {
  hover?: object;
  tap?: object;
  focus?: object;
}

const microInteractions = {
  buttonPop: {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  },
  cardLift: {
    hover: { y: -5, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }
  },
  iconSpin: {
    hover: { rotate: 180 }
  },
  linkUnderline: {
    hover: { backgroundSize: '100% 2px' }
  }
};
```

## 5. Responsive Design System

### 5.1 Breakpoints
```typescript
// utils/breakpoints.ts
const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`
};
```

### 5.2 Container Sizes
```typescript
// utils/containers.ts
const containers = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

const containerPadding = {
  mobile: '1rem',
  tablet: '2rem',
  desktop: '4rem'
};
```

...understand by yourself