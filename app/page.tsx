export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-4xl font-bold mb-4">QRScan App</h1>
      <p className="mb-4">Welcome vendor! Please log in to manage your menu.</p>
      <a
        href="/admin/login"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Login as Vendor
      </a>
    </main>
  );
}
