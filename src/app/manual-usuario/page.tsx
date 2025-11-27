// src/app/manual-usuario/page.tsx
"use client";

import { useState, type ReactNode } from "react";
import { HelpCircle, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

type Section = {
  id: string;
  title: string;
  content: ReactNode;
};

const sections: Section[] = [
  {
    id: "introduccion",
    title: "1. Introducción",
    content: (
      <>
        <p className="mb-4">
          El Sistema de Control de Proyectos (SICOP) es una plataforma web
          diseñada para facilitar la gestión de los proyectos finales de los
          alumnos y la evaluación por parte de los profesores.
        </p>
        <p className="mb-2">Este manual está dirigido a:</p>
        <ul className="mb-4 list-disc list-inside space-y-1">
          <li>Alumnos que deben cargar y actualizar su proyecto final.</li>
          <li>
            Profesores que deben revisar, realizar observaciones y aprobar o
            rechazar proyectos.
          </li>
        </ul>
        <p>
          El objetivo es explicar, de forma clara y práctica, qué puede hacer
          cada usuario y cómo hacerlo, sin entrar en detalles técnicos de
          instalación o programación.
        </p>
      </>
    ),
  },
  {
    id: "requisitos",
    title: "2. Requisitos para utilizar SICOP",
    content: (
      <>
        <p className="mb-2">
          Para poder usar el sistema SICOP, se recomienda cumplir con los
          siguientes requisitos básicos:
        </p>
        <ul className="mb-4 list-disc list-inside space-y-1">
          <li>Navegador web actualizado, preferentemente Google Chrome.</li>
          <li>Conexión a internet estable.</li>
          <li>
            Usuario y contraseña asignados por la institución (entregados por la
            cátedra o administración).
          </li>
        </ul>
        <p>
          En caso de no contar con usuario o tener problemas de acceso, el
          alumno o profesor debe comunicarlo al administrador del sistema de la
          institución.
        </p>
      </>
    ),
  },
  {
    id: "ingreso",
    title: "3. Ingreso al sistema",
    content: (
      <>
        <h3 className="mb-2 font-semibold">3.1. Cómo iniciar sesión</h3>
        <ol className="mb-4 list-decimal list-inside space-y-1">
          <li>Abrí tu navegador web.</li>
          <li>Ingresá la URL del sistema SICOP proporcionada por la institución.</li>
          <li>
            En la pantalla de inicio de sesión, completá los campos:
            <ul className="ml-4 mt-1 list-disc list-inside space-y-1">
              <li>Correo electrónico</li>
              <li>Contraseña</li>
            </ul>
          </li>
          <li>Hacé clic en el botón “Iniciar sesión”.</li>
        </ol>
        <p className="mb-6">
          Si los datos son correctos, el sistema te redirigirá automáticamente a
          tu panel principal, que dependerá de tu rol (Alumno o Profesor).
        </p>

        <h3 className="mb-2 font-semibold">3.2. ¿Olvidaste tu contraseña?</h3>
        <p className="mb-4">
          Si no recordás tu contraseña, hacé clic en{" "}
          <span className="font-semibold">“¿Olvidaste tu contraseña?”</span> y
          seguí los pasos indicados en pantalla.
        </p>

        <h3 className="mb-2 font-semibold">
          3.3. Errores habituales al iniciar sesión
        </h3>
        <ul className="space-y-3">
          <li>
            <span className="font-semibold">“Credenciales incorrectas”</span>
            <ul className="ml-4 mt-1 list-disc list-inside space-y-1">
              <li>
                Revisá que tu correo esté bien escrito (sin espacios al
                principio o al final).
              </li>
              <li>
                Verificá que la tecla Mayúsculas no esté activada al escribir la
                contraseña.
              </li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">“Usuario no registrado”</span>
            <ul className="ml-4 mt-1 list-disc list-inside space-y-1">
              <li>
                Podés no estar dado de alta en el sistema. Consultá con la
                institución si tu usuario ya fue creado.
              </li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">
              “Error del servidor” o mensaje similar
            </span>
            <ul className="ml-4 mt-1 list-disc list-inside space-y-1">
              <li>Esperá unos minutos y probá nuevamente.</li>
              <li>
                Si el problema persiste, avisá al administrador indicando el
                error y la hora aproximada en que ocurrió.
              </li>
            </ul>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "alumno",
    title: "4. Uso del sistema – Rol Alumno",
    content: (
      <>
        <p className="mb-2">El Alumno utiliza SICOP principalmente para:</p>
        <ul className="mb-4 list-disc list-inside space-y-1">
          <li>Cargar su proyecto final.</li>
          <li>Subir y actualizar los archivos PDF.</li>
          <li>Ver el estado del proyecto.</li>
          <li>Revisar observaciones realizadas por el profesor.</li>
        </ul>

        <h3 className="mb-2 font-semibold">4.1. Panel principal del alumno</h3>
        <p className="mb-4">
          Una vez que iniciás sesión como alumno, verás tu panel principal, donde
          se muestran:
        </p>
        <ul className="mb-4 list-disc list-inside space-y-1">
          <li>Datos de tu sesión.</li>
          <li>Opción para crear un nuevo proyecto.</li>
          <li>
            Botón para ver tu proyecto en caso de tenerlo, o para crear uno
            nuevo si todavía no existe.
          </li>
          <li>
            En el Header encontrarás opciones para ver el material de la
            cátedra, tu proyecto, el contacto de los profesores y tu perfil.
          </li>
        </ul>

        <h3 className="mb-2 font-semibold">4.2. Cargar un nuevo proyecto</h3>
        <ol className="mb-4 list-decimal list-inside space-y-1">
          <li>Ingresá a la opción “Mi Proyecto” o al botón “Crear Proyecto”.</li>
          <li>
            Completá los campos obligatorios, tales como:
            <ul className="ml-4 mt-1 list-disc list-inside space-y-1">
              <li>Título del proyecto.</li>
              <li>Funcionalidades.</li>
              <li>Breve descripción o resumen.</li>
            </ul>
          </li>
          <li>
            En el apartado de archivo, seleccioná tu PDF de la propuesta de
            trabajo final junto con tu historia académica.
          </li>
          <li>Revisá que todos los datos estén correctos.</li>
          <li>Hacé clic en “Enviar proyecto”.</li>
          <li>
            El sistema mostrará un mensaje confirmando que la propuesta fue
            cargada para revisión.
          </li>
          <li>
            Una vez aprobada la propuesta, podrás cargar el resto de los archivos
            PDF.
          </li>
        </ol>
        <p className="mb-6">
          <span className="font-semibold">Importante:</span> Asegurate de que el
          archivo esté en formato PDF y que no supere el tamaño máximo
          permitido. No cierres la página mientras el archivo se está subiendo.
        </p>

        <h3 className="mb-2 font-semibold">4.3. Consultar el estado del proyecto</h3>
        <p className="mb-2">
          En el panel del alumno, podés ver el estado actual de tu proyecto, por
          ejemplo:
        </p>
        <ul className="mb-4 list-disc list-inside space-y-1">
          <li>Pendiente de revisión.</li>
          <li>En revisión.</li>
          <li>Aprobado.</li>
          <li>Rechazado.</li>
        </ul>

        <h3 className="mb-2 font-semibold">
          4.4. Ver y responder observaciones del profesor
        </h3>
        <ol className="mb-4 list-decimal list-inside space-y-1">
          <li>Ingresá al detalle de tu proyecto desde el panel.</li>
          <li>
            Leé cuidadosamente los comentarios realizados por el profesor (por
            ejemplo, correcciones sugeridas, cambios de formato, ajustes en el
            contenido).
          </li>
          <li>Realizá las modificaciones necesarias en tu trabajo.</li>
          <li>Generá un nuevo PDF con la versión corregida.</li>
          <li>
            Subí la nueva versión del archivo y hacé clic en “Enviar
            actualización”.
          </li>
        </ol>
        <p className="mb-6">
          El sistema registrará que se subió una nueva versión, manteniendo la
          trazabilidad del proceso.
        </p>

        <h3 className="mb-2 font-semibold">4.5. Cambiar contraseña (Alumno)</h3>
        <ol className="mb-4 list-decimal list-inside space-y-1">
          <li>
            Hacé clic en tu nombre o icono de usuario (generalmente en la parte
            superior).
          </li>
          <li>Seleccioná la opción “Perfil” o “Cambiar contraseña”.</li>
          <li>Ingresá tu contraseña actual.</li>
          <li>Escribí tu nueva contraseña.</li>
          <li>Hacé clic en “Guardar cambios”.</li>
        </ol>

        <h3 className="mb-2 font-semibold">
          4.6. Problemas frecuentes del alumno y qué hacer
        </h3>
        <ul className="space-y-3">
          <li>
            <span className="font-semibold">
              “Datos incompletos” al enviar el formulario
            </span>
            <ul className="ml-4 mt-1 list-disc list-inside space-y-1">
              <li>
                Revisá que todos los campos obligatorios estén completos (suelen
                estar marcados con un *).
              </li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">Error al subir el archivo PDF</span>
            <ul className="ml-4 mt-1 list-disc list-inside space-y-1">
              <li>Verificá el tamaño máximo permitido.</li>
              <li>
                Confirmá que sea realmente un archivo PDF y no otro tipo.
              </li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">
              No ves cambios en el estado del proyecto
            </span>
            <ul className="ml-4 mt-1 list-disc list-inside space-y-1">
              <li>
                Tené en cuenta que la revisión puede llevar un tiempo razonable.
              </li>
              <li>
                Si pasó demasiado tiempo, consultá respetuosamente al profesor o
                administrador.
              </li>
            </ul>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "profesor",
    title: "5. Uso del sistema – Rol Profesor",
    content: (
      <>
        <p className="mb-2">El Profesor utiliza SICOP principalmente para:</p>
        <ul className="mb-4 list-disc list-inside space-y-1">
          <li>Visualizar los proyectos enviados por los alumnos.</li>
          <li>Descargar y revisar los archivos PDF.</li>
          <li>Dejar observaciones y comentarios.</li>
          <li>Aprobar, rechazar o mantener en revisión los proyectos.</li>
          <li>Subir, reemplazar, borrar o descargar material de la cátedra.</li>
        </ul>

        <h3 className="mb-2 font-semibold">5.1. Panel principal del profesor</h3>
        <p className="mb-4">
          Al iniciar sesión como profesor, verás un panel con acceso a:
        </p>
        <ul className="mb-4 list-disc list-inside space-y-1">
          <li>Material de la cátedra.</li>
          <li>Listado de proyectos.</li>
          <li>Listado de usuarios.</li>
          <li>Listado de alumnos.</li>
          <li>Historial de logs del sistema.</li>
        </ul>

        <h3 className="mb-2 font-semibold">5.2. Revisar y evaluar un proyecto</h3>
        <ol className="mb-4 list-decimal list-inside space-y-1">
          <li>Desde el listado, hacé clic sobre el proyecto a revisar.</li>
          <li>Descargá el archivo PDF del trabajo del alumno.</li>
          <li>Leé y analizá el contenido.</li>
          <li>
            Utilizá el campo de observaciones para dejar comentarios claros y
            útiles.
          </li>
          <li>
            Seleccioná el estado que corresponda:
            <ul className="ml-4 mt-1 list-disc list-inside space-y-1">
              <li>Aprobado (podés dejar un comentario opcional).</li>
              <li>
                Rechazado (debe indicarse obligatoriamente la razón del
                rechazo).
              </li>
            </ul>
          </li>
          <li>Hacé clic en “Guardar” o “Actualizar”.</li>
        </ol>
        <p className="mb-6">
          El alumno verá tus observaciones y el nuevo estado del proyecto en su
          panel.
        </p>

        <h3 className="mb-2 font-semibold">
          5.3. Consultar el historial del proyecto
        </h3>
        <p className="mb-4">
          El profesor puede acceder al historial de acciones de un proyecto,
          donde se muestran:
        </p>
        <ul className="mb-4 list-disc list-inside space-y-1">
          <li>Versiones anteriores del archivo.</li>
          <li>Cambios de estado.</li>
          <li>Observaciones realizadas en cada revisión.</li>
        </ul>

        <h3 className="mb-2 font-semibold">
          5.4. Cambiar contraseña (Profesor)
        </h3>
        <p>
          El profesor puede cambiar su contraseña siguiendo el mismo procedimiento
          que el alumno: ingresar a “Perfil”, escribir su contraseña actual,
          ingresar la nueva y guardar los cambios.
        </p>
      </>
    ),
  },
  {
    id: "recomendaciones",
    title: "6. Recomendaciones generales de uso",
    content: (
      <>
        <p className="mb-2">
          Estas recomendaciones aplican tanto para alumnos como para profesores:
        </p>
        <ul className="mb-4 list-disc list-inside space-y-1">
          <li>
            Verificá tu conexión a internet antes de subir archivos grandes.
          </li>
          <li>
            No cierres la ventana del navegador mientras el sistema está cargando
            o subiendo archivos.
          </li>
          <li>
            Leé con atención los mensajes del sistema (confirmaciones,
            advertencias, errores).
          </li>
          <li>
            Actualizá la página si sospechás que la información no está al día.
          </li>
          <li>
            Mantené tus datos de contacto actualizados (correo, nombre).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "errores",
    title: "7. Errores frecuentes y cómo resolverlos",
    content: (
      <>
        <ul className="mb-4 space-y-3">
          <li>
            <span className="font-semibold">
              “El archivo excede el tamaño permitido”
            </span>
            <ul className="ml-4 mt-1 list-disc list-inside space-y-1">
              <li>
                Comprimí el PDF o reducí su tamaño antes de intentar subirlo.
              </li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">
              “Datos incompletos” o “Campos obligatorios vacíos”
            </span>
            <ul className="ml-4 mt-1 list-disc list-inside space-y-1">
              <li>
                Revisá los campos marcados con un asterisco (*) y completalos.
              </li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">
              “No tenés permisos para acceder a esta sección”
            </span>
            <ul className="ml-4 mt-1 list-disc list-inside space-y-1">
              <li>
                Asegurate de estar ingresando con el rol correcto (Alumno o
                Profesor).
              </li>
              <li>
                Si creés que deberías tener acceso, contactá al administrador.
              </li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">
              “Error inesperado” o mensaje genérico del servidor
            </span>
            <ul className="ml-4 mt-1 list-disc list-inside space-y-1">
              <li>Esperá unos segundos y probá nuevamente.</li>
              <li>
                Si el problema se repite, avisá al administrador indicando:
                <ul className="ml-4 mt-1 list-disc list-inside space-y-1">
                  <li>Qué estabas haciendo.</li>
                  <li>Qué mensaje apareció.</li>
                  <li>Hora aproximada del error.</li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "consideraciones",
    title: "8. Consideraciones generales de uso",
    content: (
      <>
        <ul className="mb-4 list-disc list-inside space-y-1">
          <li>
            Todos los campos marcados como obligatorios deben completarse antes
            de enviar los formularios.
          </li>
          <li>
            El sistema puede realizar actualizaciones periódicas para mostrar
            cambios recientes.
          </li>
          <li>
            En caso de error o pérdida de conexión, el sistema notifica al
            usuario y permite reintentar la operación.
          </li>
          <li>
            Se recomienda mantener actualizado el navegador y usar una conexión
            segura.
          </li>
        </ul>
      </>
    ),
  },
];

export default function ManualUsuarioPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = sections[currentIndex];

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () =>
    setCurrentIndex((i) => Math.min(sections.length - 1, i + 1));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        {/* Encabezado */}
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50">
              <HelpCircle className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-slate-900">
                Manual de usuario – SICOP
              </h1>
              <p className="text-sm text-slate-600">
                Guía práctica para alumnos y profesores.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <BookOpen className="h-4 w-4" />
            <span>
              Sección {currentIndex + 1} de {sections.length}
            </span>
          </div>
        </header>

        {/* Contenido principal */}
        <div className="grid gap-6 md:grid-cols-[220px,1fr]">
          {/* Navegación lateral / paginación */}
          <aside className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Secciones
            </h2>
            <nav className="space-y-1">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-full rounded-md px-3 py-2 text-left text-xs md:text-sm transition ${
                    index === currentIndex
                      ? "border border-blue-500 bg-blue-50 text-blue-900 font-medium"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </aside>

          {/* Sección actual */}
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              {current.title}
            </h2>
            <div className="prose prose-sm max-w-none text-slate-800">
              {current.content}
            </div>

            {/* Controles Anterior / Siguiente */}
            <div className="mt-6 flex items-center justify-between gap-2">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs md:text-sm disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <span className="text-xs text-slate-500">
                Página {currentIndex + 1} de {sections.length}
              </span>
              <button
                onClick={goNext}
                disabled={currentIndex === sections.length - 1}
                className="inline-flex items-center gap-1 rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs text-white md:text-sm disabled:opacity-40 hover:bg-blue-700"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
