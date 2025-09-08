'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VendorLoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('OTP sent to your email!');
        setTimeout(() => {
          router.push(`/admin/login/verify?email=${email}`);
        }, 1000);
      } else {
        setMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSendOTP}
        className="bg-white shadow-md p-6 rounded w-full max-w-sm space-y-4"
      >
        <h2 className="text-xl font-semibold text-center">Vendor Login</h2>
        <input
          type="email"
          required
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </button>
        {message && <p className="text-center text-sm text-green-600">{message}</p>}
      </form>
    </div>
  );
}
