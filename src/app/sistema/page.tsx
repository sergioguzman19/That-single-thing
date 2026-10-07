import type { Metadata } from "next";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LANE_COLORS, laneVar } from "@/lib/lanes";
import { ThemeToggle, ToastDemo } from "./demos";
import { MotionDemo } from "./motion-demo";

export const metadata: Metadata = { title: "Sistema · That Single Thing" };

const CORE = [
  { token: "background", name: "Blanco", note: "Fondo. Nunca crema." },
  { token: "foreground", name: "Sombra verde", note: "Tinta y botón principal" },
  { token: "muted-foreground", name: "Piedra", note: "Texto secundario" },
  { token: "border", name: "Junta", note: "Bordes y separadores" },
  { token: "maya", name: "Azul maya", note: "Acento: líneas y foco" },
  { token: "maya-ink", name: "Maya tinta", note: "Acento para texto" },
  { token: "portal", name: "Luz de patio", note: "Interior del arco" },
  { token: "rot", name: "Ocre Izamal", note: "Tarea pudriéndose" },
  { token: "destructive", name: "Flamboyán", note: "Acciones destructivas" },
];

const MOTION_SPEC = [
  { name: "Llegada", what: "La tarea sube desde el umbral y se enfoca (de borroso a nítido).", timing: "520 ms · ease-portal", util: "animate-portal-arrive" },
  { name: "Despacho", what: "Al tocar Hecho, la tarea se eleva y se disuelve hacia la luz.", timing: "280 ms · ease-dispatch", util: "animate-portal-dispatch" },
  { name: "Respiro", what: "El arco se ilumina un instante con azul maya mientras se va una y llega la otra.", timing: "600 ms · ease-portal", util: "animate-portal-glow" },
  { name: "Trazo", what: "Al cambiar de carril, su línea se dibuja de arriba hacia el umbral.", timing: "420 ms · ease-portal", util: "animate-lane-draw" },
  { name: "Interacción", what: "Hover y cambios de estado en controles. El botón baja 1 px al presionarlo.", timing: "150 ms", util: "duration-150" },
];

const DEMO_LANES = [
  { id: "concejo", name: "Concejo", color: "maya" },
  { id: "clientes", name: "Clientes", color: "flamboyan" },
  { id: "empresa", name: "Empresa", color: "anil" },
  { id: "personal", name: "Personal", color: "patio" },
  { id: "hyrox", name: "Hyrox", color: "izamal" },
];

function Section({ id, title, lede, children }: { id: string; title: string; lede?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="grid gap-6 border-t border-foreground/80 pt-5">
      <div className="grid gap-2">
        <h2 className="text-3xl">{title}</h2>
        {lede ? <p className="max-w-prose text-sm text-muted-foreground">{lede}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function SistemaPage() {
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-16 px-4 py-10 sm:px-6 sm:py-14">
      <header className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="eyebrow">That Single Thing · Sistema de diseño</span>
          <ThemeToggle />
        </div>
        <h1 className="text-5xl leading-none sm:text-6xl">Portal sobre blanco</h1>
        <p className="max-w-prose text-muted-foreground">
          shadcn/ui pone la estructura; la identidad entra por los tokens de <code className="font-mono text-sm">globals.css</code> y
          por dos componentes firma: el Merge y el Portal. Referentes: arquitectura contemporánea de Mérida y running moderno.
        </p>
        <ul className="grid gap-1 text-sm sm:grid-cols-3">
          <li><b className="font-semibold">Una sola cosa.</b> Un solo portal por pantalla.</li>
          <li><b className="font-semibold">Un solo acento.</b> El azul maya marca foco, nada más.</li>
          <li><b className="font-semibold">Blanco de verdad.</b> El calor viene del arco y la tipografía.</li>
        </ul>
      </header>

      <Section id="firma" title="Firma" lede="Los carriles convergen en el umbral y la tarea única vive dentro del arco. Es la única pantalla que tiene que ser memorable. Esta demo es interactiva.">
        <MotionDemo />
      </Section>

      <Section id="movimiento" title="Movimiento" lede="La calma también se mueve. Las cosas llegan despacio y se van rápido. Nada parpadea, nada rebota y nada se mueve si nadie hizo nada.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="eyebrow">
              <tr className="border-b">
                <th className="py-2 pr-4 font-medium">Momento</th>
                <th className="py-2 pr-4 font-medium">Qué pasa</th>
                <th className="py-2 pr-4 font-medium">Duración · curva</th>
                <th className="py-2 font-medium">Utilidad</th>
              </tr>
            </thead>
            <tbody className="[&_td]:py-3 [&_td]:pr-4 [&_td]:align-top [&_tr]:border-b">
              {MOTION_SPEC.map((m) => (
                <tr key={m.name}>
                  <td className="font-semibold">{m.name}</td>
                  <td className="text-muted-foreground">{m.what}</td>
                  <td className="font-mono text-xs whitespace-nowrap tabular-nums">{m.timing}</td>
                  <td className="font-mono text-xs">{m.util}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="grid gap-2 text-sm sm:grid-cols-3">
          <li><b className="font-semibold">Despachar es rápido.</b> 280 ms: terminar algo debe sentirse inmediato.</li>
          <li><b className="font-semibold">Llegar es lento.</b> 520 ms: la nueva tarea se presenta con calma, no te asalta.</li>
          <li><b className="font-semibold">Movimiento reducido.</b> Si el sistema lo pide, todo se vuelve un fundido de 150 ms.</li>
        </ul>
      </Section>

      <Section id="icono" title="Ícono" lede="Umbral: un arco con proporción de puerta y un solo punto azul maya esperando en el umbral. Bajo 48 px se usa una versión de trazo más grueso. Fuente única: scripts/generate-icons.mjs (npm run icons).">
        <div className="flex flex-wrap items-end gap-6">
          {[
            { src: "/icons/icon-1024.png", label: "Claro", size: 120 },
            { src: "/icons/icon-dark-1024.png", label: "Oscuro", size: 120 },
            { src: "/icons/icon-192.png", label: "60 px", size: 60 },
            { src: "/icon.svg", label: "32 px · pestaña", size: 32 },
          ].map((icon) => (
            <figure key={icon.src} className="grid justify-items-center gap-2">
              <Image src={icon.src} alt="" width={icon.size} height={icon.size} className="rounded-[22.4%] ring-1 ring-border" />
              <figcaption className="eyebrow">{icon.label}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section id="color" title="Color" lede="Tokens semánticos. En código se usan por nombre (bg-maya, text-rot), nunca con hex.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CORE.map((c) => (
            <div key={c.token} className="overflow-hidden rounded-md ring-1 ring-border">
              <div className="h-16" style={{ background: `var(--${c.token})` }} />
              <div className="grid gap-0.5 p-2.5 text-xs">
                <span className="font-semibold">{c.name}</span>
                <span className="font-mono text-muted-foreground">--{c.token}</span>
                <span className="text-muted-foreground">{c.note}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="carriles" title="Carriles" lede="Cada carril escoge un color. Los nombres salen de Mérida y la península. Se usan como líneas, puntos y bordes, nunca como fondos grandes.">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          {LANE_COLORS.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <span className="size-4 shrink-0 rounded-full" style={{ background: laneVar(c.id) }} />
              <span className="grid text-sm leading-tight">
                {c.name}
                <span className="font-mono text-xs text-muted-foreground">lane-{c.id}</span>
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="tipografia" title="Tipografía" lede="Marcellus para lo que se lee como inscripción (títulos, la tarea). Hanken Grotesk para todo lo demás. Geist Mono solo para cifras alineadas.">
        <div className="grid gap-5">
          <div className="grid gap-1">
            <span className="eyebrow">Display · Marcellus · 60 / 36 / 28</span>
            <p className="font-heading text-6xl leading-none">Una sola cosa</p>
            <p className="font-heading text-4xl leading-tight">Revisar el proyecto de acuerdo</p>
            <p className="font-heading text-[1.75rem] leading-tight">Preparar la intervención para la plenaria</p>
          </div>
          <Separator />
          <div className="grid gap-1">
            <span className="eyebrow">Texto · Hanken Grotesk · 16 / 14 / 12</span>
            <p className="max-w-prose">Leer el articulado y los anexos, marcar los artículos con riesgo jurídico y preparar observaciones para la comisión.</p>
            <p className="text-sm text-muted-foreground">Texto secundario para descripciones y ayudas.</p>
            <p className="text-xs text-muted-foreground">Metadatos: en cola hace 10 días.</p>
          </div>
          <Separator />
          <div className="grid gap-1">
            <span className="eyebrow">Inscripción · utilidad .eyebrow</span>
            <span className="eyebrow">Martes · Mañana · Bloque de Concejo</span>
          </div>
          <div className="grid gap-1">
            <span className="eyebrow">Cifras · Geist Mono</span>
            <span className="font-mono text-sm tabular-nums">07:00 – 12:00 · 4 en cola · 24 h/semana</span>
          </div>
        </div>
      </Section>

      <Section id="componentes" title="Componentes" lede="shadcn/ui sin modificar. La identidad les llega por los tokens.">
        <div className="grid gap-8">
          <div className="grid gap-3">
            <span className="eyebrow">Botones</span>
            <div className="flex flex-wrap gap-2">
              <Button>Hecho</Button>
              <Button variant="outline">Empezar</Button>
              <Button variant="secondary">Mandar al final</Button>
              <Button variant="ghost">Cancelar</Button>
              <Button variant="destructive">Eliminar carril</Button>
              <Button variant="link">Volver al plan</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="xs">xs</Button>
              <Button size="sm">sm</Button>
              <Button>default</Button>
              <Button size="lg">lg</Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="demo-title">Tarea</Label>
              <Input id="demo-title" placeholder="¿Qué hay que hacer?" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="demo-lane">Carril</Label>
              <Select defaultValue="concejo">
                <SelectTrigger id="demo-lane" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_LANES.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      <span className="size-2 rounded-full" style={{ background: laneVar(l.color) }} />
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="demo-notes">Descripción</Label>
              <Textarea id="demo-notes" placeholder="Opcional" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="demo-first" />
              <Label htmlFor="demo-first">Saltar la fila: ponerla de primera</Label>
            </div>
          </div>

          <div className="grid gap-3">
            <span className="eyebrow">Insignias</span>
            <div className="flex flex-wrap gap-2">
              <Badge>En curso</Badge>
              <Badge variant="secondary">4 en cola</Badge>
              <Badge variant="outline">Modo libre</Badge>
              <Badge variant="outline" className="border-rot text-rot">Pudriéndose</Badge>
              <Badge variant="destructive">Vencida</Badge>
            </div>
          </div>

          <div className="grid gap-3">
            <span className="eyebrow">Pestañas</span>
            <Tabs defaultValue="ahora" className="max-w-md">
              <TabsList>
                <TabsTrigger value="ahora">Ahora</TabsTrigger>
                <TabsTrigger value="carriles">Carriles</TabsTrigger>
                <TabsTrigger value="semana">Semana</TabsTrigger>
              </TabsList>
              <TabsContent value="ahora" className="text-sm text-muted-foreground">La tarea única.</TabsContent>
              <TabsContent value="carriles" className="text-sm text-muted-foreground">Las colas de cada frente.</TabsContent>
              <TabsContent value="semana" className="text-sm text-muted-foreground">Los bloques de la semana.</TabsContent>
            </Tabs>
          </div>

          <div className="grid gap-3">
            <span className="eyebrow">Capas</span>
            <div className="flex flex-wrap gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Diálogo</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>¿Eliminar el carril Concejo?</DialogTitle>
                    <DialogDescription>Se eliminan sus 4 tareas y sus bloques de la semana. No se puede deshacer.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancelar</Button>
                    <Button variant="destructive">Eliminar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">Panel inferior</Button>
                </SheetTrigger>
                <SheetContent side="bottom">
                  <SheetHeader>
                    <SheetTitle>Capturar tarea</SheetTitle>
                    <SheetDescription>Así se abre la captura rápida en el celular.</SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Menú</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Editar carril</DropdownMenuItem>
                  <DropdownMenuItem>Cambiar color</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">Eliminar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Ayuda</Button>
                </TooltipTrigger>
                <TooltipContent>Una tarea con 7 días o más en cola se marca en ocre.</TooltipContent>
              </Tooltip>
              <ToastDemo />
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
