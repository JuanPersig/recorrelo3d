import React from "react"
import ArcCardCarousel, { type ArcCardItem } from "@/components/ui/arc-card-carousel"
import { motion } from "framer-motion"
import {
  MessageCircle,
  Mail,
  ExternalLink,
  Play,
  Hand,
  CheckCircle2,
  Smartphone,
  SunMoon,
  QrCode,
  Globe2,
} from "lucide-react"

// Tarjetas con fotos reales y renders 3D para el Hero
const heroCards: ArcCardItem[] = [
  { src: "/assets/portada-demo.jpg", alt: "Living en 3D con el ventanal" },
  { src: "/assets/real-living.png", alt: "Living real del anuncio" },
  { src: "/assets/3d-dormitorio-noche.jpg", alt: "Dormitorio en 3D, de noche" },
  { src: "/assets/real-dormitorio.png", alt: "Dormitorio real" },
  { src: "/assets/3d-cocina.jpg", alt: "Cocina en 3D" },
  { src: "/assets/real-cocina.png", alt: "Cocina real del anuncio" },
  { src: "/assets/real-comedor.png", alt: "Comedor y living real" },
  { src: "/assets/3d-comedor.jpg", alt: "Mesa para dos en 3D" },
]

// Tarjetas de problema y solución
const problemCards = [
  {
    type: "Problema",
    badgeColor: "text-[#5a6460]/70",
    bgColor: "bg-[#f7f6f3] border-[#e2e6e4]",
    textColor: "text-[#1a1f1d]",
    descColor: "text-[#5a6460]",
    title: "Las fotos distorsionan",
    desc: "Los gran angular hacen que el espacio parezca más grande. El huésped llega con expectativas que las fotos no cumplen, y eso genera malas reseñas.",
  },
  {
    type: "Problema",
    badgeColor: "text-[#5a6460]/70",
    bgColor: "bg-[#f7f6f3] border-[#e2e6e4]",
    textColor: "text-[#1a1f1d]",
    descColor: "text-[#5a6460]",
    title: "Nadie sabe cómo es el plano",
    desc: "Las fotos son momentos aislados. El comprador o huésped no puede entender la distribución del departamento ni cómo fluye el espacio.",
  },
  {
    type: "Solución",
    badgeColor: "text-emerald-200",
    bgColor: "bg-[#2f5d50] text-white border-transparent shadow-md",
    textColor: "text-white",
    descColor: "text-white/85",
    title: "Un recorrido que genera confianza",
    desc: "Con recorrelo3D el visitante camina virtualmente por cada ambiente. Ve exactamente qué hay y cómo está distribuido, antes de reservar o visitar.",
  },
  {
    type: "Solución",
    badgeColor: "text-emerald-200",
    bgColor: "bg-[#2f5d50] text-white border-transparent shadow-md",
    textColor: "text-white",
    descColor: "text-white/85",
    title: "Listo en días, no semanas",
    desc: "No necesitás contratar un fotógrafo 360°, escáner láser ni visita técnica. Trabajamos solo con las fotos que ya tenés.",
  },
]

// el recorrido de muestra, en el mismo sitio: así funciona igual con dominio propio
const DEMO_PATH = "/departamento-prueba/"

export default function App() {
  const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
  const [demoOn, setDemoOn] = React.useState(!touch)
  const host = typeof window !== "undefined" ? window.location.host : "recorrelo3d.pages.dev"
  const scrollToDemo = (e: React.MouseEvent) => {
    e.preventDefault()
    document.getElementById("ejemplo")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-[#1a1f1d] selection:bg-[#2f5d50] selection:text-white">
      {/* ─── NAVEGACIÓN ─── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e2e6e4] h-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-full flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5 font-semibold text-lg tracking-tight">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2f5d50]" />
            <span>recorrelo3D</span>
          </a>
          <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5a6460]">
            <li>
              <a href="#problema" className="hover:text-[#1a1f1d] transition-colors">
                El problema
              </a>
            </li>
            <li>
              <a href="#ejemplo" className="hover:text-[#1a1f1d] transition-colors">
                Demo
              </a>
            </li>
            <li>
              <a href="#comparativa" className="hover:text-[#1a1f1d] transition-colors">
                Fidelidad
              </a>
            </li>
            <li>
              <a href="#como-funciona" className="hover:text-[#1a1f1d] transition-colors">
                Proceso
              </a>
            </li>
            <li>
              <a href="#que-ofrecemos" className="hover:text-[#1a1f1d] transition-colors">
                Qué incluye
              </a>
            </li>
            <li>
              <a href="#contacto" className="hover:text-[#1a1f1d] transition-colors">
                Contacto
              </a>
            </li>
          </ul>
          <a
            href="#contacto"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#2f5d50] hover:bg-[#254a40] text-white text-sm font-medium transition-all shadow-sm active:scale-95"
          >
            Consultar
          </a>
        </div>
      </nav>

      {/* ─── SECCIÓN 1: HERO (PANTALLA COMPLETA CON RUEDA ARCO Y TEXTO CENTRADO) ─── */}
      <section id="hero" className="relative w-full min-h-[calc(100svh-64px)] flex flex-col justify-center">
        <ArcCardCarousel
          items={heroCards}
          height="calc(100svh - 64px)"
          scrollPerCard={0.09}
          step={14}
          radius={14}
          caption={false}
          loop={false}
          snap={false}
          ariaLabel="Recorrido visual de fotos reales y modelo 3D"
        >
          {/* BLOQUE CENTRADO EXACTAMENTE EN EL MEDIO DE LA PANTALLA */}
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            <span className="inline-block text-[11px] font-semibold tracking-widest text-[#2f5d50] uppercase mb-4 bg-[#f0f4f2] px-4 py-1.5 rounded-full shadow-2xs">
              recorrelo3D
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-[#1a1f1d] leading-[1.12]">
              Tu departamento en 3D,
              <br />
              solo con las fotos
            </h1>

            <p className="mt-5 text-base sm:text-lg text-[#5a6460] leading-relaxed max-w-xl text-balance">
              Convertimos las fotos de tu propiedad en un recorrido 3D navegable desde el celular. Sin visita, sin equipo especial.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <a
                href="#ejemplo"
                onClick={scrollToDemo}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#2f5d50] hover:bg-[#254a40] text-white text-sm font-medium transition-all shadow-md active:scale-95"
              >
                <Play className="w-4 h-4" />
                <span>Ver demo en vivo</span>
              </a>
              <a
                href="https://wa.me/5493412471429?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20recorrelo3D"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white border border-[#e2e6e4] hover:border-[#2f5d50] text-[#1a1f1d] text-sm font-medium transition-all shadow-sm active:scale-95"
              >
                <MessageCircle className="w-4 h-4 text-[#2f5d50]" />
                <span>Escribir por WhatsApp</span>
              </a>
            </div>

            <p className="mt-4 text-[11px] text-[#5a6460]/70 tracking-wide">
              <span className="md:hidden">Deslizá hacia abajo para ver más</span>
              <span className="hidden md:inline">
                Scrolleá para avanzar &middot; También podés girar las fotos con la rueda sobre ellas
              </span>
            </p>
          </div>
        </ArcCardCarousel>
      </section>

      {/* ─── SECCIÓN 2: EL PROBLEMA (PANTALLA COMPLETA CON COMPONENTES QUE APARECEN CON EL SCROLL) ─── */}
      <section
        id="problema"
        className="w-full md:min-h-[calc(100svh-64px)] flex flex-col justify-center py-10 px-5 sm:px-8 border-t border-[#e2e6e4] bg-[#fbfbf9]"
      >
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <span className="text-xs font-semibold tracking-widest text-[#2f5d50] uppercase">
              El problema
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#1a1f1d]">
              Las fotos ya no alcanzan
            </h2>
          </motion.div>

          {/* Grilla 2x2 donde cada componente aparece al scrollear */}
          <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {problemCards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.55,
                  delay: idx * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`p-6 sm:p-8 rounded-2xl border ${card.bgColor} transition-all duration-300 hover:shadow-lg`}
              >
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${card.badgeColor}`}>
                  {card.type}
                </span>
                <h3 className={`text-lg sm:text-xl font-semibold ${card.textColor} mt-2 mb-2`}>
                  {card.title}
                </h3>
                <p className={`text-sm sm:text-base ${card.descColor} leading-relaxed`}>
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECCIÓN 3: DEMO EN VIVO (PANTALLA COMPLETA CON EL MODELO COMO ANTES) ─── */}
      <section
        id="ejemplo"
        className="w-full md:min-h-[calc(100svh-64px)] flex flex-col justify-center py-8 px-5 sm:px-8 bg-white border-t border-[#e2e6e4]"
      >
        <div className="max-w-6xl mx-auto w-full flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center max-w-2xl mx-auto mb-5 sm:mb-6"
          >
            <span className="inline-block text-[11px] font-semibold tracking-widest text-[#2f5d50] uppercase mb-2 bg-[#f0f4f2] px-4 py-1.5 rounded-full shadow-2xs">
              Demo en vivo
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1a1f1d]">
              Recorrelo vos mismo
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#5a6460] leading-relaxed max-w-xl mx-auto">
              Un recorrido 3D real del departamento demo, armado a partir de sus fotos.
              Caminá por los ambientes, cambiá entre vista de día y de noche.
            </p>
          </motion.div>

          {/* MOCKUP DEL NAVEGADOR LIMPIO Y SIN DISTORSIÓN CON EL RECORRIDO 3D */}
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-5xl rounded-2xl overflow-hidden border border-[#e2e6e4] shadow-2xl bg-[#111] flex flex-col"
          >
            {/* Topbar estilo navegador con botones de control y URL */}
            <div className="bg-[#1c221f] px-4 py-2.5 sm:py-3 flex items-center gap-3 border-b border-white/10 shrink-0">
              <div className="hidden sm:flex gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 min-w-0 bg-white/10 rounded-full px-3 sm:px-4 py-1 text-[11px] sm:text-xs text-white/70 font-mono flex items-center justify-between">
                <span className="truncate">{host + DEMO_PATH}</span>
                <span className="text-[10px] text-emerald-400 font-sans font-medium uppercase tracking-wide shrink-0 ml-2">
                  En vivo
                </span>
              </div>
            </div>

            {/* Recorrido 3D Interactivo funcional y navegable */}
            <div className="relative w-full h-[60svh] sm:h-[58vh] min-h-[380px]">
              <iframe
                src={DEMO_PATH}
                title="Recorrido 3D interactivo"
                className="w-full h-full border-none absolute inset-0"
                allow="fullscreen"
                loading="lazy"
                tabIndex={demoOn ? 0 : -1}
              />
              {!demoOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#1a1f1d]/35 backdrop-blur-[1px] px-6 text-center">
                  <button
                    type="button"
                    onClick={() => setDemoOn(true)}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-[#1a1f1d] text-sm font-semibold shadow-lg active:scale-95"
                  >
                    <Hand className="w-4 h-4 text-[#2f5d50]" />
                    Tocá para recorrer acá
                  </button>
                  <a
                    href={DEMO_PATH}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-white underline underline-offset-4"
                  >
                    Abrir en pantalla completa
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </motion.div>

          <p className="text-center text-xs sm:text-sm text-[#5a6460] mt-3">
            Abajo elegí «Vista general» o «Recorrido» &middot; funciona en el celular y en la compu
          </p>
        </div>
      </section>

      {/* ─── SECCIÓN 4: COMPARATIVA REAL VS 3D (PANTALLA COMPLETA) ─── */}
      <section
        id="comparativa"
        className="w-full md:min-h-[calc(100svh-64px)] flex flex-col justify-center py-10 px-5 sm:px-8 bg-[#f7f6f3] border-t border-[#e2e6e4]"
      >
        <div className="max-w-4xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-xl mx-auto"
          >
            <span className="text-xs font-semibold tracking-widest text-[#2f5d50] uppercase">
              Fidelidad
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-semibold tracking-tight text-[#1a1f1d]">
              De la foto al modelo 3D
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#5a6460]">
              Reconstruimos la distribución, los muebles y las proporciones a partir de lo que muestran tus fotos.
            </p>
          </motion.div>

          <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto">
            {/* Foto real */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl overflow-hidden border border-[#e2e6e4] shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[4/3] max-h-[38vh] bg-neutral-100 overflow-hidden">
                <img
                  src="/assets/comparativa-real.png"
                  alt="Foto original del departamento"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-4 left-4 bg-[#1a1f1d]/85 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Foto original
                </span>
              </div>
              <div className="p-4 sm:p-5">
                <strong className="block text-sm sm:text-base font-semibold text-[#1a1f1d]">
                  Foto real del anuncio
                </strong>
                <span className="text-xs sm:text-sm text-[#5a6460] mt-1 block">
                  Captura tomada con celular para la publicación.
                </span>
              </div>
            </motion.div>

            {/* Render 3D */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl overflow-hidden border border-[#e2e6e4] shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[4/3] max-h-[38vh] bg-neutral-100 overflow-hidden">
                <img
                  src="/assets/comparativa-3d.jpg"
                  alt="El mismo ambiente en el modelo 3D"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-4 left-4 bg-[#2f5d50] text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Modelo 3D
                </span>
              </div>
              <div className="p-4 sm:p-5">
                <strong className="block text-sm sm:text-base font-semibold text-[#1a1f1d]">
                  Recorrido 3D interactivo
                </strong>
                <span className="text-xs sm:text-sm text-[#5a6460] mt-1 block">
                  El mismo ambiente, visto desde el mismo lugar que la foto.
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── SECCIÓN 5: EL PROCESO (PANTALLA COMPLETA - SIN MENCIONAR VIDEOS) ─── */}
      <section
        id="como-funciona"
        className="w-full md:min-h-[calc(100svh-64px)] flex flex-col justify-center py-10 px-5 sm:px-8 bg-[#f7f6f3] border-t border-[#e2e6e4]"
      >
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-xs font-semibold tracking-widest text-[#2f5d50] uppercase">
                Paso a paso
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-[#1a1f1d]">
                Cómo es el proceso
              </h2>
            </motion.div>

            <div className="mt-8 space-y-4 sm:space-y-5">
              {[
                {
                  num: "01",
                  title: "Nos mandás las fotos",
                  desc: "Las fotos que ya tenés son suficientes. Cuantas más, mejor el resultado.",
                },
                {
                  num: "02",
                  title: "Analizamos el espacio",
                  desc: "A partir de las fotos reconstruimos la distribución, las medidas aproximadas y los materiales de cada ambiente.",
                },
                {
                  num: "03",
                  title: "Modelamos el recorrido 3D",
                  desc: "Armamos un modelo fiel a tus fotos: colores, muebles e iluminación de día y de noche.",
                },
                {
                  num: "04",
                  title: "Te entregamos todo",
                  desc: "Link interactivo para compartir con tus huéspedes y tarjeta con código QR lista para imprimir.",
                },
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: idx * 0.1 }}
                  className={`flex gap-4 sm:gap-5 pb-4 sm:pb-5 ${idx < 3 ? "border-b border-[#e2e6e4]" : ""}`}
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#2f5d50]/30 text-[#2f5d50] font-semibold flex items-center justify-center text-xs shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-[#1a1f1d]">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5a6460] mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3] max-h-[46vh] bg-neutral-200"
          >
            <img
              src="/assets/3d-living-balcon.jpg"
              alt="Living y balcón en 3D, generado a partir de las fotos"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full text-xs font-medium text-[#1a1f1d] shadow-sm">
              Render generado desde fotos
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── SECCIÓN 6: QUÉ OFRECEMOS (PANTALLA COMPLETA - SIN MENCIONAR VIDEOS) ─── */}
      <section
        id="que-ofrecemos"
        className="w-full md:min-h-[calc(100svh-64px)] flex flex-col justify-center py-10 px-5 sm:px-8 border-t border-[#e2e6e4] bg-[#fbfbf9]"
      >
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xs font-semibold tracking-widest text-[#2f5d50] uppercase">
              Lo que incluye
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-[#1a1f1d]">
              Todo para mostrar tu propiedad
            </h2>
          </motion.div>

          <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {[
              {
                icon: Smartphone,
                title: "Recorrido 3D navegable",
                desc: "El visitante camina por el departamento desde su celular o computadora. Sin instalar nada, abre directo desde un link.",
              },
              {
                icon: SunMoon,
                title: "Vista de día y de noche",
                desc: "El modelo incluye iluminación natural y artificial. El visitante puede alternar entre ambas para ver cómo luce el espacio en cada momento.",
              },
              {
                icon: QrCode,
                title: "Tarjeta con QR",
                desc: "Tarjeta de bienvenida para dejar en el departamento. El huésped la escanea y abre el recorrido 3D al instante.",
              },
              {
                icon: Globe2,
                title: "Link permanente",
                desc: "Una URL fija para cada propiedad. Funciona en celular y PC, sin cuentas, sin vencimiento, compartible en cualquier plataforma.",
              },
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="p-6 sm:p-8 rounded-2xl bg-white border border-[#e2e6e4] shadow-sm flex items-start gap-4 sm:gap-5 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#2f5d50]/10 flex items-center justify-center text-[#2f5d50] shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#1a1f1d]">{item.title}</h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-[#5a6460] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── SECCIÓN 7: PARA QUIÉN ES (PANTALLA COMPLETA) ─── */}
      <section
        id="para-quien"
        className="w-full md:min-h-[calc(100svh-64px)] flex flex-col justify-center py-10 px-5 sm:px-8 bg-[#f7f6f3] border-t border-[#e2e6e4]"
      >
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xs font-semibold tracking-widest text-[#2f5d50] uppercase">
              Para quién es
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-[#1a1f1d]">
              Anfitriones e inmobiliarias
            </h2>
          </motion.div>

          <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white p-6 sm:p-8 rounded-2xl border border-[#e2e6e4] shadow-sm"
            >
              <h3 className="text-base sm:text-lg font-semibold text-[#1a1f1d] mb-4">
                Anfitriones de Airbnb y alquiler temporal
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-[#5a6460]">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#2f5d50] mt-0.5 shrink-0" />
                  <span>Generá confianza antes de que el huésped reserve</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#2f5d50] mt-0.5 shrink-0" />
                  <span>Reducí cancelaciones por expectativas no cumplidas</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#2f5d50] mt-0.5 shrink-0" />
                  <span>Destacate de los anuncios con solo fotos estáticas</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#2f5d50] mt-0.5 shrink-0" />
                  <span>Compartí el link directo por WhatsApp en tu mensaje de bienvenida</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#2f5d50] mt-0.5 shrink-0" />
                  <span>Dejá la tarjeta QR en el departamento para dar la bienvenida</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-6 sm:p-8 rounded-2xl border border-[#e2e6e4] shadow-sm"
            >
              <h3 className="text-base sm:text-lg font-semibold text-[#1a1f1d] mb-4">
                Inmobiliarias y asesores
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-[#5a6460]">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#2f5d50] mt-0.5 shrink-0" />
                  <span>Mostrá propiedades sin coordinar visitas presenciales desgastantes</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#2f5d50] mt-0.5 shrink-0" />
                  <span>Calificá compradores e interesados antes de la primera cita</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#2f5d50] mt-0.5 shrink-0" />
                  <span>Ofrecé el recorrido como herramienta de captación para propietarios</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#2f5d50] mt-0.5 shrink-0" />
                  <span>Un link permanente por propiedad, compartible por WhatsApp</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── SECCIÓN 8: CONTACTO Y FOOTER (PANTALLA COMPLETA) ─── */}
      <section
        id="contacto"
        className="w-full md:min-h-[calc(100svh-64px)] flex flex-col justify-between py-12 px-5 sm:px-8 bg-[#fbfbf9] border-t border-[#e2e6e4]"
      >
        <div className="max-w-3xl mx-auto w-full text-center flex flex-col items-center my-auto">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xs font-semibold tracking-widest text-[#2f5d50] uppercase">
              Contacto
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#1a1f1d]">
              ¿Querés un recorrido 3D de tu propiedad?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#5a6460] max-w-lg mx-auto">
              Contame de qué departamento se trata y te muestro cómo queda. Solo necesitamos las fotos.
            </p>
          </motion.div>

          {/* BOTONES DE CONTACTO */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 w-full"
          >
            <a
              href="https://wa.me/5493412471429?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20recorrelo3D"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto max-w-sm inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-white border border-[#e2e6e4] hover:border-[#2f5d50] text-[#1a1f1d] shadow-sm hover:shadow-md transition-all active:scale-95 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#2f5d50] flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-sm font-semibold text-[#1a1f1d]">
                  Escribir por WhatsApp
                </strong>
                <span className="text-xs text-[#5a6460]">+54 9 341 247-1429</span>
              </div>
            </a>

            <a
              href="mailto:persigjuanandres@gmail.com?subject=Consulta%20recorrelo3D"
              className="w-full sm:w-auto max-w-sm inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-white border border-[#e2e6e4] hover:border-[#2f5d50] text-[#1a1f1d] shadow-sm hover:shadow-md transition-all active:scale-95 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-slate-50 text-[#2f5d50] flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-sm font-semibold text-[#1a1f1d]">
                  Enviar un mail
                </strong>
                <span className="text-xs text-[#5a6460]">persigjuanandres@gmail.com</span>
              </div>
            </a>
          </motion.div>
        </div>

        {/* FOOTER */}
        <footer className="pt-8 border-t border-[#e2e6e4] text-xs text-[#5a6460] w-full">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2 font-semibold text-sm text-[#1a1f1d]">
              <span className="w-2 h-2 rounded-full bg-[#2f5d50]" />
              recorrelo3D
            </div>
            <p>Recorridos 3D de departamentos a partir de fotos · Argentina</p>
            <a
              href="mailto:persigjuanandres@gmail.com"
              className="hover:text-[#1a1f1d] transition-colors"
            >
              persigjuanandres@gmail.com
            </a>
          </div>
        </footer>
      </section>
    </div>
  )
}
