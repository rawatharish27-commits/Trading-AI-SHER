export default function NotFound() {
  return (
    <div className="h-screen w-screen bg-[#0B0F14] flex items-center justify-center">
      <div className="text-center space-y-6">
        <h2 className="text-6xl font-bold text-white">404</h2>
        <h3 className="text-2xl font-semibold text-gray-300">Page not found</h3>
        <p className="text-gray-400 max-w-md mx-auto px-4">
          The page you are looking for does not exist or has been moved.
        </p>
        <a
          href="/"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          Go back home
        </a>
      </div>
    </div>
  );
}
