'use client';

import { useState } from 'react';
import { Building2, User, MapPin, Mail, Phone, Notebook, FileText, Globe } from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';
import { CreateSupplierDto } from '@/services/suppliers';

interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateSupplierDto) => void;
  submitting?: boolean;
}

export function CreateSupplierModal({ isOpen, onClose, onSave, submitting }: CreateSupplierModalProps) {
  const [name, setName] = useState('');
  const [rfc, setRfc] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');

  const handleReset = () => {
    setName('');
    setRfc('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setNotes('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      rfc: rfc.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      zipCode: zipCode.trim() || undefined,
      contactName: contactName.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    handleReset();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nuevo Proveedor" size="xl">
      <div className="space-y-8 py-2">
        {/* ── Información General ─── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
              Información de la Empresa
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Input
                label="Nombre / Razón Social"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Distribuidora Nacional SA de CV"
                required
                autoFocus
              />
            </div>

            <Input
              label="RFC"
              value={rfc}
              onChange={(e) => setRfc(e.target.value.toUpperCase())}
              placeholder="XAXX010101000"
              hint="Opcional"
            />

            <Input
              label="Email de la Empresa"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ventas@proveedor.com"
            />

            <Input
              label="Teléfono Principal"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 55 1234 5678"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Dirección ─── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-amber-600" />
              </div>
              <h4 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                Ubicación
              </h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Dirección"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle, número, colonia"
                />
              </div>

              <Input
                label="Ciudad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ciudad de México"
              />

              <Input
                label="Estado"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="CDMX"
              />

              <div className="sm:col-span-2">
                <Input
                  label="Código Postal"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="06600"
                />
              </div>
            </div>
          </section>

          {/* ── Contacto ─── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-purple-600" />
              </div>
              <h4 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                Persona de Contacto
              </h4>
            </div>
            
            <div className="space-y-4">
              <Input
                label="Nombre Completo"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ej: Juan Pérez"
              />

              <Input
                label="Teléfono Directo"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+52 55 1234 5678"
              />

              <Input
                label="Email Directo"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="juan.perez@proveedor.com"
              />
            </div>
          </section>
        </div>

        {/* ── Notas ─── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
              <Notebook className="w-4 h-4 text-zinc-600" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
              Notas Adicionales
            </h4>
          </div>
          
          <div className="w-full space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">
              Observaciones
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Información relevante sobre condiciones comerciales, tiempos de entrega, etc..."
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 text-sm placeholder:text-zinc-400 min-h-[100px] transition-all resize-none"
            />
          </div>
        </section>

        {/* ── Botones ─── */}
        <div className="flex items-center gap-3 pt-6 border-t border-zinc-100">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            className="flex-1 h-11" 
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="flex-1 h-11 shadow-sm" 
            disabled={!name.trim() || submitting}
          >
            {submitting ? 'Guardando...' : 'Crear Proveedor'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
