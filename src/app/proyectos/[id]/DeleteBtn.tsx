'use client';
import { useRouter } from 'next/navigation';
import { deleteProyecto } from '../actions';

export default function DeleteBtn({ id }: { id: string }) {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        if (!confirm('¿Seguro que quieres borrar este proyecto? Esta acción es permanente.')) return;
        try {
          await deleteProyecto({ proyectoId: id } as any);
          alert('Proyecto borrado');
          router.push('/proyectos');
        } catch (e: any) {
          alert(e?.message ?? 'No se pudo borrar');
        }
      }}
      className="btn bg-red-600 hover:bg-red-700 w-full sm:w-auto hover:cursor-pointer"
    >
      Borrar
    </button>
  );
}
