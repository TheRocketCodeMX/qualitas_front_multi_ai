import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ErrorImageModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
}

export function ErrorImageModal({ open, onClose, imageUrl }: ErrorImageModalProps) {
  const [loading, setLoading] = useState(true);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="relative bg-white rounded-lg shadow-2xl border border-gray-300 max-w-5xl w-[98vw] m-4 flex flex-col items-center p-4 pt-16">
        {/* Botón cerrar arriba a la derecha */}
        <button
          onClick={onClose}
          className="absolute top-6 right-8 text-gray-500 hover:text-gray-800 text-3xl font-bold z-10 focus:outline-none"
          aria-label="Cerrar"
        >
          ×
        </button>
        {/* Loader */}
        {loading && (
          <div className="flex items-center justify-center min-h-[200px] w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8BC34A]" />
          </div>
        )}
        {/* Imagen */}
        <img
          src={imageUrl}
          alt="Error"
          className={`max-h-[60vh] max-w-full object-contain transition-opacity duration-300 border border-gray-300 rounded-lg mb-4 ${loading ? "opacity-0" : "opacity-100"}`}
          onLoad={() => setLoading(false)}
          style={{ display: loading ? "none" : "block" }}
        />
      </div>
    </div>
  );
} 