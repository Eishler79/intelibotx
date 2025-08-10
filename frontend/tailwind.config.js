/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'gradient-intelibot-primary': 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
        'gradient-intelibot-card': 'linear-gradient(145deg, #1a1f3a 0%, #2a2f4a 100%)',
        'gradient-intelibot-gold': 'linear-gradient(135deg, #f7931a 0%, #e8841a 100%)',
      },
      boxShadow: {
        'intelibot-card': '0 8px 32px rgba(10, 14, 39, 0.4)',
        'intelibot-gold': '0 4px 20px rgba(247, 147, 26, 0.2)',
        'intelibot-primary': '0 4px 20px rgba(10, 14, 39, 0.3)',
      },
      colors: {
        // 🎨 InteliBotX Design System - Paleta Dorada/Azul Preferida
        intelibot: {
          // Backgrounds
          'bg-primary': '#0a0e27',        // Azul oscuro profundo - fondo principal
          'bg-secondary': '#1a1f3a',      // Azul gris oscuro - cards y containers
          'bg-tertiary': '#2a2f4a',       // Azul gris medio - elementos elevados
          
          // Colores de Acento - DORADO PRINCIPAL
          'accent-gold': '#f7931a',       // Dorado vibrante - botones CTA
          'accent-gold-hover': '#e8841a', // Dorado hover state
          'accent-gold-light': '#f7931a33', // Dorado transparente 20%
          
          // Success/Error
          'success-green': '#00d4aa',     // Verde éxito - confirmaciones
          'success-green-light': '#00d4aa33', // Verde transparente
          'error-red': '#ff4757',         // Rojo error - alertas
          'error-red-light': '#ff475733', // Rojo transparente
          
          // Textos
          'text-primary': '#ffffff',      // Blanco puro - títulos principales
          'text-secondary': '#b8bcc8',    // Gris claro - texto secundario
          'text-muted': '#6c7293',        // Gris medio - texto auxiliar
          'text-on-gold': '#0a0e27',      // Texto oscuro sobre dorado
          
          // Bordes
          'border-primary': '#2a2f4a',    // Borde principal - divisores
          'border-secondary': '#3a3f5a',  // Borde secundario - inputs
          'border-accent': '#f7931a',     // Borde dorado - elementos activos
        },
        // Compatibilidad con sistema anterior
        neo: {
          background: "#0a0e27",  // Usar colores del Design System
          card: "#1a1f3a",
          primary: "#f7931a",     // Cambiar a dorado
          secondary: "#00d4aa",   // Cambiar a verde success
          success: "#00d4aa",
          error: "#ff4757",
          textMain: "#ffffff",
          textMuted: "#b8bcc8",
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}