import { describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
  Tabs,
  Textarea,
  ToastProvider,
  useToast,
} from './index';

describe('Button', () => {
  it('en estado de carga se deshabilita y lo anuncia', () => {
    render(
      <Button loading loadingText="Guardando…">
        Guardar
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Guardando…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('ButtonLink navega con aspecto de botón', () => {
    render(
      <ButtonLink href="/x" variant="outline" fullWidth>
        Ir
      </ButtonLink>,
    );
    expect(screen.getByRole('link', { name: 'Ir' })).toHaveClass('w-full');
  });
});

describe('campos de formulario', () => {
  it('asocian etiqueta, ayuda y error accesibles', () => {
    render(
      <>
        <Input label="Título" hint="Entre 5 y 120" />
        <Textarea label="Descripción" error="Muy corta" required />
        <Select label="Orden" hideLabel>
          <option>Uno</option>
        </Select>
      </>,
    );
    expect(screen.getByLabelText('Título')).toHaveAccessibleDescription('Entre 5 y 120');
    const description = screen.getByLabelText(/Descripción/);
    expect(description).toHaveAttribute('aria-invalid', 'true');
    expect(description).toHaveAccessibleDescription('Muy corta');
    expect(description).toBeRequired();
    expect(screen.getByRole('alert')).toHaveTextContent('Muy corta');
    expect(screen.getByLabelText('Orden')).toBeInTheDocument();
  });
});

describe('Modal', () => {
  function Harness({ locked = false }: { locked?: boolean }) {
    const [open, setOpen] = useState(true);
    return (
      <>
        <span>{open ? 'abierto' : 'cerrado'}</span>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="¿Seguro?"
          description="No se puede deshacer"
          locked={locked}
          footer={<Button>Sí</Button>}
        >
          contenido
        </Modal>
      </>
    );
  }

  it('expone rol de diálogo con título y descripción, y se cierra', async () => {
    render(<Harness />);
    const dialog = screen.getByRole('dialog', { name: '¿Seguro?' });
    expect(dialog).toHaveAccessibleDescription('No se puede deshacer');
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.getByText('cerrado')).toBeInTheDocument();
  });

  it('bloqueado no se puede cerrar con Escape', () => {
    render(<Harness locked />);
    act(() => {
      screen.getByRole('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
    });
    expect(screen.getByText('abierto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeDisabled();
  });
});

describe('Tabs', () => {
  it('cambia de pestaña con clic y con las flechas', async () => {
    function Harness() {
      const [tab, setTab] = useState('a');
      return (
        <Tabs
          label="Secciones"
          value={tab}
          onChange={setTab}
          items={[
            { id: 'a', label: 'Uno', count: 2 },
            { id: 'b', label: 'Dos' },
          ]}
        >
          panel {tab}
        </Tabs>
      );
    }
    render(<Harness />);
    const [first, second] = screen.getAllByRole('tab');
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(second).toHaveAttribute('tabindex', '-1');
    first.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('panel b');
    expect(second).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('panel a');
    await userEvent.keyboard('{End}');
    await userEvent.keyboard('{ArrowLeft}');
    await userEvent.click(second);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('panel b');
  });
});

describe('Toast', () => {
  it('muestra, anuncia y cierra notificaciones', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    function Trigger() {
      const { toast } = useToast();
      return (
        <>
          <button onClick={() => toast({ title: 'Guardado', tone: 'success' })}>ok</button>
          <button onClick={() => toast({ title: 'Falló', description: 'detalle', tone: 'error' })}>mal</button>
        </>
      );
    }
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByText('ok'));
    expect(screen.getByRole('status')).toHaveTextContent('Guardado');
    await userEvent.click(screen.getByText('mal'));
    expect(screen.getByRole('alert')).toHaveTextContent('Falló');
    await userEvent.click(screen.getAllByRole('button', { name: 'Cerrar notificación' })[1]);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.queryByText('Guardado')).not.toBeInTheDocument();
  });

  it('useToast fuera del provider lanza error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Broken() {
      useToast();
      return null;
    }
    expect(() => render(<Broken />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });
});

describe('piezas de presentación', () => {
  it('renderizan su contenido', () => {
    render(
      <>
        <Badge tone="success">Disponible</Badge>
        <Card>
          <CardHeader>Cabecera</CardHeader>
          <CardBody>Cuerpo</CardBody>
        </Card>
        <Skeleton data-testid="sk" />
        <EmptyState
          icon={<span />}
          title="Nada aquí"
          description="Prueba otra cosa"
          action={<button>Acción</button>}
          tone="danger"
        />
      </>,
    );
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByText('Cuerpo')).toBeInTheDocument();
    expect(screen.getByTestId('sk')).toHaveAttribute('aria-hidden');
    expect(screen.getByRole('heading', { name: 'Nada aquí' })).toBeInTheDocument();
  });
});
