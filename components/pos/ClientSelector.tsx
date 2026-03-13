'use client';

/**
 * ClientSelector — POS
 *
 * Combobox para seleccionar o crear un cliente en el flujo de venta.
 *
 * Comportamiento:
 *  1. Sin cliente seleccionado → muestra input de búsqueda.
 *     - Escribe para filtrar clientes existentes en tiempo real.
 *     - Al hacer blur sin seleccionar: guarda el texto como nombre libre (walk-in).
 *  2. Dropdown → lista de resultados + opción "Crear cliente" al pie.
 *  3. Opción "Crear cliente" → formulario inline con nombre + documento.
 *     - Al crear: el nuevo cliente queda seleccionado automáticamente.
 *  4. Cliente seleccionado → chip con nombre + botón X para limpiar.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  User, UserPlus, X, Search, ChevronDown,
  Loader2, Check, UserCheck,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { getClients, createClient } from '@/services/clients';
import type { ClientDetail } from '@/services/clients/clients.types';
import { usePosStore } from '@/stores';

// ── Constantes ───────────────────────────────────────────────────────────────
const SEARCH_DEBOUNCE_MS = 250;
const MAX_RESULTS = 20;

// ── Componente principal ─────────────────────────────────────────────────────
export function ClientSelector() {
  const { clientId, clientName, setClientId, setClientName } = usePosStore(
    useShallow((s) => ({
      clientId: s.clientId,
      clientName: s.clientName,
      setClientId: s.setClientId,
      setClientName: s.setClientName,
    }))
  );

  // ── Estado local ──
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<ClientDetail[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Formulario de creación rápida
  const [newName, setNewName] = useState('');
  const [newDoc, setNewDoc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Refs ──
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const newNameRef = useRef<HTMLInputElement>(null);

  // ── Búsqueda con debounce ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      try {
        setLoadingSearch(true);
        const result = await getClients({
          search: query || undefined,
          limit: MAX_RESULTS,
          active: true,
        });
        setOptions(result.items);
      } catch {
        setOptions([]);
      } finally {
        setLoadingSearch(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // ── Cierre al click fuera ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        handleBlurClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Al cerrar sin seleccionar, guarda el texto como nombre libre (walk-in) */
  const handleBlurClose = useCallback(() => {
    if (query.trim() && !clientId) {
      // Guarda como nombre libre si no hay cliente con ID
      setClientName(query.trim());
    }
    setIsOpen(false);
    setShowCreate(false);
  }, [query, clientId, setClientName]);

  const openDropdown = () => {
    setIsOpen(true);
    // Pre-carga sin query para mostrar clientes recientes
  };

  const selectClient = (client: ClientDetail) => {
    setClientId(client.id);
    setClientName(client.name);
    setIsOpen(false);
    setShowCreate(false);
    setQuery('');
  };

  const clearClient = () => {
    setClientId(null);
    setClientName('');
    setQuery('');
    setShowCreate(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const startCreate = () => {
    setShowCreate(true);
    setNewName(query); // pre-rellena con lo que el usuario ya escribió
    setNewDoc('');
    setCreateError(null);
    setTimeout(() => newNameRef.current?.focus(), 50);
  };

  const cancelCreate = () => {
    setShowCreate(false);
    setNewName('');
    setNewDoc('');
    setCreateError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCreateClient = async () => {
    const name = newName.trim();
    if (!name) return;

    try {
      setCreating(true);
      setCreateError(null);
      const created = await createClient({
        name,
        document: newDoc.trim() || undefined,
      });
      selectClient(created);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error al crear el cliente');
    } finally {
      setCreating(false);
    }
  };

  // Enter en el formulario de creación
  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreateClient();
    if (e.key === 'Escape') cancelCreate();
  };

  // ── Render: cliente con ID seleccionado ───────────────────────────────────
  if (clientId) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <UserCheck className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{clientName}</p>
          <p className="text-[11px] text-primary/70 font-medium">Cliente vinculado · #{clientId}</p>
        </div>
        <button
          type="button"
          onClick={clearClient}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
          title="Quitar cliente"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── Render: nombre libre (walk-in) sin clientId ───────────────────────────
  if (!clientId && clientName && !isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          setQuery(clientName);
          setClientName('');
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
      >
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{clientName}</p>
          <p className="text-[11px] text-gray-400">Nombre libre — toca para cambiar</p>
        </div>
        <X
          className="w-4 h-4 text-gray-400 hover:text-red-500 flex-shrink-0"
          onClick={(e) => { e.stopPropagation(); clearClient(); }}
        />
      </button>
    );
  }

  // ── Render: combobox ──────────────────────────────────────────────────────
  return (
    <div className="relative" ref={containerRef}>

      {/* Input de búsqueda */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar o seleccionar cliente..."
          className="w-full pl-10 pr-9 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={openDropdown}
          autoComplete="off"
        />
        <ChevronDown
          className={`absolute right-3 w-4 h-4 text-gray-400 transition-transform pointer-events-none ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">

          {/* ── Lista de clientes ── */}
          {!showCreate && (
            <div className="max-h-52 overflow-y-auto">
              {loadingSearch ? (
                <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Buscando...</span>
                </div>
              ) : options.length === 0 ? (
                <div className="py-4 px-4 text-sm text-gray-400 text-center">
                  {query
                    ? <>No hay resultados para <strong>"{query}"</strong></>
                    : 'Escribe para buscar clientes...'}
                </div>
              ) : (
                options.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()} // evita que blur cierre antes del click
                    onClick={() => selectClient(client)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-800 font-medium truncate block">{client.name}</span>
                      {client.document && (
                        <span className="text-xs text-gray-400 truncate block">{client.document}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* ── Opción "Crear nuevo cliente" ── */}
          {!showCreate ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={startCreate}
              className="w-full flex items-center gap-3 px-4 py-3 border-t border-gray-100 hover:bg-green-50 text-green-700 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-3.5 h-3.5 text-green-600" />
              </div>
              <span className="text-sm font-semibold">
                {query ? `Crear cliente "${query}"` : 'Crear nuevo cliente'}
              </span>
            </button>
          ) : (
            /* ── Formulario inline de creación ── */
            <div className="p-3 space-y-2.5 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-1.5 mb-1">
                <UserPlus className="w-3.5 h-3.5 text-green-600" />
                <p className="text-xs font-semibold text-gray-700">Nuevo cliente</p>
              </div>

              <input
                ref={newNameRef}
                type="text"
                placeholder="Nombre *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleCreateKeyDown}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
              />

              <input
                type="text"
                placeholder="Documento / NIT (opcional)"
                value={newDoc}
                onChange={(e) => setNewDoc(e.target.value)}
                onKeyDown={handleCreateKeyDown}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
              />

              {createError && (
                <p className="text-xs text-red-500 px-1">{createError}</p>
              )}

              <div className="flex gap-2 pt-0.5">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={cancelCreate}
                  className="flex-1 py-2 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleCreateClient}
                  disabled={!newName.trim() || creating}
                  className="flex-1 py-2 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors"
                >
                  {creating
                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Creando...</>
                    : <><Check className="w-3 h-3" /> Crear</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
