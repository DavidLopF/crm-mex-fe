import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Types ─── */

export interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number; // 0-based index
  className?: string;
}

/* ─── Stepper ─── */

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <nav aria-label="Progreso" className={cn('flex items-start gap-0', className)}>
      {steps.map((step, index) => {
        const isDone = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            {/* Step */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              {/* Circle */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold',
                  'ring-2 transition-all duration-200',
                  isDone
                    ? 'bg-zinc-900 ring-zinc-900 text-white'
                    : isActive
                    ? 'bg-white ring-zinc-900 text-zinc-900'
                    : 'bg-white ring-zinc-200 text-zinc-400'
                )}
              >
                {isDone ? <Check className="w-4 h-4" /> : <span>{index + 1}</span>}
              </div>

              {/* Label */}
              <div className="text-center max-w-[80px]">
                <p
                  className={cn(
                    'text-xs font-medium leading-tight',
                    isActive ? 'text-zinc-900' : isDone ? 'text-zinc-600' : 'text-zinc-400'
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {/* Connector */}
            {!isLast && (
              <div className="flex-1 flex items-start pt-4">
                <div
                  className={cn(
                    'h-0.5 w-full transition-colors duration-300',
                    isDone ? 'bg-zinc-900' : 'bg-zinc-200'
                  )}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/* ─── StepperContent — shows children only for the active step ─── */

interface StepperContentProps {
  steps: Step[];
  currentStep: number;
  children: React.ReactNode[];
}

export function StepperContent({ steps, currentStep, children }: StepperContentProps) {
  const child = children[currentStep];
  if (!child) return null;

  return (
    <div className="mt-6 animate-fadeIn" key={steps[currentStep]?.id}>
      {child}
    </div>
  );
}

/* ─── StepperActions ─── */

interface StepperActionsProps {
  steps: Step[];
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
  nextLabel?: string;
  finishLabel?: string;
  isLoading?: boolean;
  canNext?: boolean;
}

export function StepperActions({
  steps,
  currentStep,
  onBack,
  onNext,
  onFinish,
  nextLabel = 'Siguiente',
  finishLabel = 'Finalizar',
  isLoading = false,
  canNext = true,
}: StepperActionsProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          isFirst
            ? 'text-zinc-300 cursor-not-allowed'
            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
        )}
      >
        Atrás
      </button>

      <button
        type="button"
        onClick={isLast ? onFinish : onNext}
        disabled={!canNext || isLoading}
        className={cn(
          'px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all',
          'bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center gap-2'
        )}
      >
        {isLoading && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {isLast ? finishLabel : nextLabel}
      </button>
    </div>
  );
}
