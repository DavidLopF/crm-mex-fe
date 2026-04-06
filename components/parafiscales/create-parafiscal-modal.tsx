'use client';

import { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import { CreateParafiscalDto, TIPOS_PARAFISCAL, TIPO_LABEL, TipoParafiscal } from '@/services/parafiscales';

interface CreateParafiscalModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  onSave:      (data: CreateParafiscalDto) => void;
  submitting?: boolean;
}

const INITIAL: CreateParafiscalDto = {
  tipo:      'BANCO',
  nombre:    '',
  documento: '',
  tipoDoc:   '31',
  nitDv:     '',
  telefono:  '',
  email:     '',
  notas:     '',
};

export function CreateParafiscalModal({ isOpen, onClose, onSave, submitting }: CreateParafiscalModalProps) {
  const [form, setForm] = useState<CreateParafiscalDto>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateParafiscalDto, string>>>({});

  const set = <K extends keyof CreateParafiscalDto>(key: K, value: CreateParafiscalDto[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.nombre.trim())  e.nombre = 'El nombre es obligatorio';
    if (!form.tipo)           e.tipo   = 'El tipo es obligatorio';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleClose = () => {
    setForm(INITIAL);
    setErrors({});
    onClose();
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      tipo:      form.tipo,
      nombre:    form.nombre.trim(),
      documento: form.documento?.trim()  || undefined,
      tipoDoc:   form.tipoDoc?.trim()    || undefined,
      nitDv:     form.nitDv?.trim()      || undefined,
      telefono:  form.telefono?.trim()   || undefined,
      email:     form.email?.trim()      || undefined,
      notas:     form.notas?.trim()      || undefined,
    });
    setForm(INITIAL);
    setErrors({});
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nuevo Parafiscal" size="lg">
      <div className="space-y-5">

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Tipo <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {TIPOS_PARAFISCAL.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set('tipo', t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
                  form.tipo === t
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-primary/50'
                }`}
              >
                {TIPO_LABEL[t]}
              </button>
            ))}
          </div>
          {errors.tipo && <p className="text-xs text-red-500 mt-1">{errors.tipo}</p>}
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Nombre / Razón social <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder={form.tipo === 'BANCO' ? 'Ej: Bancolombia S.A.' : form.tipo === 'FONDO' ? 'Ej: Porvenir S.A.' : 'Ej: Juan Pérez García'}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nombre ? 'border-red-400' : 'border-zinc-200'}`}
            autoFocus
          />
          {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
        </div>

        {/* Documento */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Tipo doc.</label>
            <select
              value={form.tipoDoc ?? '31'}
              onChange={(e) => set('tipoDoc', e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="31">NIT (31)</option>
              <option value="13">Cédula (13)</option>
              <option value="22">Cédula Ext. (22)</option>
              <option value="42">Otro (42)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Número de documento</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={form.documento ?? ''}
                onChange={(e) => set('documento', e.target.value)}
                placeholder="900123456"
                className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {form.tipoDoc === '31' && (
                <input
                  type="text"
                  value={form.nitDv ?? ''}
                  onChange={(e) => set('nitDv', e.target.value.slice(0, 2))}
                  placeholder="DV"
                  maxLength={2}
                  className="w-14 px-2 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center"
                />
              )}
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={form.telefono ?? ''}
              onChange={(e) => set('telefono', e.target.value)}
              placeholder="601 234 5678"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => set('email', e.target.value)}
              placeholder="contacto@entidad.com"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Notas</label>
          <textarea
            value={form.notas ?? ''}
            onChange={(e) => set('notas', e.target.value)}
            rows={3}
            placeholder="Información adicional..."
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          />
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Guardando…' : 'Crear'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
