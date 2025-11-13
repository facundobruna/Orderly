import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center px-4 max-w-4xl">
        <h1 className="text-6xl font-bold text-blue-600 mb-4">Orderly</h1>
        <p className="text-2xl text-gray-700 mb-8">
          Sistema de Pedidos para Restaurantes
        </p>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Simplifica la gestión de pedidos de tu negocio. Los clientes pueden
          ordenar escaneando el QR de su mesa o accediendo al menú online.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/login"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Registrarse
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">Pedidos Rápidos</h3>
            <p className="text-gray-600">
              Los clientes ordenan desde su móvil sin esperar
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-semibold mb-2">Múltiples Pagos</h3>
            <p className="text-gray-600">
              Efectivo, transferencia o Mercado Pago
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="text-4xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold mb-2">QR por Mesa</h3>
            <p className="text-gray-600">
              Cada mesa tiene su código QR único
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
