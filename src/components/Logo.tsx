import Image from "next/image";

/** Logo de Flexxus (fondo transparente). En modo oscuro se apoya sobre una placa clara para que se lea el gris. */
export function Logo({ ancho, className = "" }: { ancho: number; className?: string }) {
  return (
    <Image
      src="/logo-flexxus.png"
      alt="Flexxus"
      width={170}
      height={60}
      priority
      style={{ width: ancho, height: "auto" }}
      className={`logo ${className}`}
    />
  );
}
