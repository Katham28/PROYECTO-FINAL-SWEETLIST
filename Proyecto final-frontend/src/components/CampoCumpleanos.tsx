import CampoFecha from "@/components/CampoFecha";
import { fechaLocal } from "@/validacionRegistro";

export type CampoCumpleanosProps = { valor: string; onChange: (valor: string) => void; disabled?: boolean };
export default function CampoCumpleanos(props: CampoCumpleanosProps) {
  return <CampoFecha {...props} etiqueta="Cumpleaños (opcional):" maximo={fechaLocal(new Date())} inicial="2000-01-01" permitirQuitar />;
}
