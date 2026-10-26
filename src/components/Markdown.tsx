import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Texto con formato (Markdown). No interpreta HTML crudo, así que es seguro mostrar lo que cargan los usuarios. */
export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export const AYUDA_FORMATO = "Formato: **negrita**, *cursiva*, ## Título, - lista, 1. lista numerada, [texto](https://link), > cita";
