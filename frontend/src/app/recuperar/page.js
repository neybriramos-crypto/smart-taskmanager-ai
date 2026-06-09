"use client";
import { useState } from "react";
import Link from "next/link";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  const handleRecuperar = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setEnviado(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecerla.
          </p>
        </div>

        {enviado ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-emerald-50 text-emerald-800 text-sm rounded-xl border border-emerald-100">
              ¡Listo! Si el correo coincide con una cuenta activa, recibirás un enlace de recuperación pronto.
            </div>
            <Link href="/login" className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline">
              Volver al Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRecuperar} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow-lg transition-all text-center"
            >
              Enviar Enlace
            </button>

            <p className="text-center text-sm">
              <Link href="/login" className="text-slate-500 hover:text-slate-800 transition-all text-medium hover:underline">
                Volver al inicio de sesión
              </Link>
            </p>
          </form>
        )}

      </div>
    </div>
  );
}