import React, { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format, isToday, isYesterday, differenceInCalendarDays, parseISO } from 'date-fns';

interface Solicitud {
  nombreLote: string
  fechaCreacion: number
  fechaCreacionStr: string
  estadoLote: "COMPLETADO" | "EN_PROCESO" | "EN_COLA"
  totalCotizaciones: number
  cotizacionesExitosas: number
  cotizacionesError: number
  cotizacionesPendientes: number
  progreso: number
  idLote: number
}

interface CatalogoTableProps {
  solicitudes: Solicitud[]
  onDownloadResults: (nombreLote: string) => void
  onRefreshStatus: (nombreLote: string) => void
  isRefreshing?: boolean
}

const handleDownloadResults = async (idLote: number, nombreLote: string) => {
  try {
    const response = await fetch(`http://localhost:8080/cotizacion-api/api/cotizacion-masiva/lote/${idLote}/descargar`, {
      method: 'GET',
    });
    if (!response.ok) throw new Error('No se pudo descargar el archivo');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombreLote}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert('Error al descargar el archivo');
  }
};

function getFechaGrupo(fechaStr: string) {
  const fecha = new Date(fechaStr.replace(' ', 'T'));
  if (isToday(fecha)) return 'Hoy';
  if (isYesterday(fecha)) return 'Ayer';
  const diff = differenceInCalendarDays(new Date(), fecha);
  if (diff < 7) return 'Esta semana';
  return 'Anterior';
}

function agruparPorFecha(solicitudes: Solicitud[]) {
  return solicitudes.reduce((acc, solicitud) => {
    const grupo = getFechaGrupo(solicitud.fechaCreacionStr);
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(solicitud);
    return acc;
  }, {} as Record<string, Solicitud[]>);
}

export default function CatalogoTable({ solicitudes, onDownloadResults, onRefreshStatus, isRefreshing = false }: CatalogoTableProps) {
  const grupos = agruparPorFecha(solicitudes);
  const ordenGrupos = ['Hoy', 'Ayer', 'Esta semana', 'Anterior'];

  // Estado para controlar qué grupos están abiertos
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
    Hoy: true,
    Ayer: false,
    'Esta semana': false,
    Anterior: false,
  });

  // Estado para controlar cuántos registros se muestran por grupo
  const [visibleByGroup, setVisibleByGroup] = useState<{ [key: string]: number }>({
    Hoy: 3,
    Ayer: 3,
    'Esta semana': 3,
    Anterior: 3,
  });

  const toggleGroup = (grupo: string) => {
    setOpenGroups(prev => ({ ...prev, [grupo]: !prev[grupo] }));
  };

  const showMore = (grupo: string) => {
    setVisibleByGroup(prev => ({
      ...prev,
      [grupo]: prev[grupo] + 3
    }));
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "COMPLETADO":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completado</Badge>
      case "EN_PROCESO":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">En proceso</Badge>
      case "EN_COLA":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">En cola</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const getProgressPercentage = (solicitud: Solicitud) => {
    if (solicitud.estadoLote === "COMPLETADO") return 100
    const total = solicitud.totalCotizaciones
    const completed = solicitud.cotizacionesExitosas + solicitud.cotizacionesError
    return Math.round((completed / total) * 100)
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID de solicitud</TableHead>
            <TableHead>Fecha de carga</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Progreso</TableHead>
            <TableHead>Desglose</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordenGrupos.map(grupo => (
            grupos[grupo] && grupos[grupo].length > 0 && (
              <React.Fragment key={grupo}>
                <TableRow
                  className="cursor-pointer bg-gray-50"
                  onClick={() => toggleGroup(grupo)}
                >
                  <TableCell colSpan={6} className="font-semibold text-gray-700 text-sm py-2 flex items-center">
                    <ChevronDown className={`mr-2 transition-transform ${openGroups[grupo] ? 'rotate-180' : ''}`} />
                    {grupo}
                  </TableCell>
                </TableRow>
                {openGroups[grupo] && (
                  <>
                    {grupos[grupo].slice(0, visibleByGroup[grupo]).map((solicitud) => (
                      <TableRow key={solicitud.nombreLote}>
                        <TableCell className="font-medium">{solicitud.nombreLote}</TableCell>
                        <TableCell>{solicitud.fechaCreacionStr}</TableCell>
                        <TableCell>{getStatusBadge(solicitud.estadoLote)}</TableCell>
                        <TableCell>
                          {(() => {
                            const total = solicitud.totalCotizaciones || 0;
                            const hechas = (solicitud.cotizacionesExitosas || 0) + (solicitud.cotizacionesError || 0);
                            const progreso = total > 0 ? Math.round((hechas / total) * 100) : 0;
                            const getColor = (p: number) => {
                              if (p === 100) return "#22c55e";
                              if (p > 80) return "#a3e635";
                              if (p > 40) return "#facc15";
                              return "#f87171";
                            };
                            if (total === 0) {
                              return (
                                <div className="relative flex items-center justify-center w-10 h-10">
                                  <svg width="32" height="32" className="block">
                                    <circle cx="16" cy="16" r="14" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                                  </svg>
                                  <span className="absolute text-xs font-semibold text-gray-400">-</span>
                                </div>
                              );
                            }
                            return (
                              <div className="relative flex items-center justify-center w-10 h-10">
                                <svg width="32" height="32" className="block">
                                  {/* Círculo de fondo */}
                                  <circle
                                    cx="16"
                                    cy="16"
                                    r="14"
                                    fill="none"
                                    stroke="#e5e7eb"
                                    strokeWidth="4"
                                  />
                                  
                                  {/* Animación de dos arcos opuestos giratorios - solo para procesos en curso */}
                                  {progreso < 100 && (
                                    <g className="animate-spin" style={{ transformOrigin: '16px 16px', animationDuration: '3s' }}>
                                      {/* Primer arco (25% superior) */}
                                      <circle
                                        cx="16"
                                        cy="16"
                                        r="14"
                                        fill="none"
                                        stroke="#9ca3af"
                                        strokeWidth="4"
                                        strokeDasharray={`${Math.PI * 14 * 0.25} ${Math.PI * 14 * 0.75}`}
                                        strokeLinecap="round"
                                        opacity="0.8"
                                      />
                                      {/* Segundo arco (25% inferior, opuesto 180°) */}
                                      <circle
                                        cx="16"
                                        cy="16"
                                        r="14"
                                        fill="none"
                                        stroke="#9ca3af"
                                        strokeWidth="4"
                                        strokeDasharray={`${Math.PI * 14 * 0.25} ${Math.PI * 14 * 0.75}`}
                                        strokeDashoffset={`${Math.PI * 14 * 0.5}`}
                                        strokeLinecap="round"
                                        opacity="0.8"
                                      />
                                    </g>
                                  )}
                                  
                                  {/* Progreso real */}
                                  <circle
                                    cx="16"
                                    cy="16"
                                    r="14"
                                    fill="none"
                                    stroke={getColor(progreso)}
                                    strokeWidth="4"
                                    strokeDasharray={2 * Math.PI * 14}
                                    strokeDashoffset={2 * Math.PI * 14 * (1 - progreso / 100)}
                                    strokeLinecap="round"
                                    style={{ transition: "stroke-dashoffset 0.7s" }}
                                  />
                                </svg>
                                
                                {/* Contenido central */}
                                {progreso === 100 ? (
                                  <svg className="absolute w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <span className="absolute text-xs font-semibold text-gray-700 z-10">{progreso}%</span>
                                )}
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    {solicitud.cotizacionesExitosas} exitosas
                                  </Badge>
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    {solicitud.cotizacionesError} errores
                                  </Badge>
                                  {solicitud.cotizacionesPendientes > 0 && (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                      {solicitud.cotizacionesPendientes} pendientes
                                    </Badge>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Total de cotizaciones: {solicitud.totalCotizaciones}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {solicitud.estadoLote === "EN_PROCESO" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRefreshStatus(solicitud.nombreLote)}
                                disabled={isRefreshing}
                              >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                              </Button>
                            )}
                            {solicitud.estadoLote === "COMPLETADO" && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDownloadResults(solicitud.idLote, solicitud.nombreLote)}
                                title="Descargar Excel"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {grupos[grupo].length > visibleByGroup[grupo] && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-2">
                          <button
                            className="text-[#8BC34A] font-semibold hover:underline"
                            onClick={e => {
                              e.stopPropagation();
                              showMore(grupo);
                            }}
                          >
                            + Mostrar más
                          </button>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </React.Fragment>
            )
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 