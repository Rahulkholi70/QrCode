'use client';
import { useEffect, useState } from 'react';

interface Vendor {
  _id: string;
  email: string;
  restaurantName?: string;
  phone?: string;
  address?: string;
  description?: string;
  logo?: string;
}

export default function SettingsPage() {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState({
    restaurantName: '',
    phone: '',
    address: '',
    description: '',
    logo: '',
  });
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({
    message: '',
    type: null,
  });

  const getTokenFromCookie = () => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token') {
        return value;
      }
    }
    return null;
  };

  // Fetch vendor profile
  const fetchProfile = async () => {
    const token = getTokenFromCookie();
    const res = await fetch('/api/vendor/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.vendor) {
      setVendor(data.vendor);
      setForm({
        restaurantName: data.vendor.restaurantName || '',
        phone: data.vendor.phone || '',
        address: data.vendor.address || '',
        description: data.vendor.description || '',
        logo: data.vendor.logo || '',
      });
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Toast notification handler
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: null }), 3000);
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setForm({ ...form, logo: data.imageUrl });
        showToast('✅ Logo uploaded successfully!', 'success');
      } else {
        showToast(data.error || '❌ Failed to upload logo!', 'error');
      }
    } catch (error) {
      showToast('❌ Failed to upload logo!', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = getTokenFromCookie();
    const res = await fetch('/api/vendor/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      await fetchProfile();
      showToast('✅ Profile updated successfully!', 'success');
      console.log('Updated profile:', form);
    } else {
      showToast('❌ Failed to update profile!', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Toast Notification */}
      <div
        className={`fixed top-4 right-4 z-[9999] transition-all duration-300 transform ${
          toast.type ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        } px-4 py-3 rounded-lg shadow-lg text-white max-w-sm ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}
      >
        {toast.message}
      </div>

      <h1 className="text-3xl font-bold mb-8">🏪 Restaurant Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Restaurant Name */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Restaurant Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Name
              </label>
              <input
                type="text"
                value={form.restaurantName}
                onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Enter restaurant name"
              />  
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description / Tagline
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 h-24 resize-none"
                placeholder="Enter restaurant description or tagline"/>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={vendor?.email || ''}
                disabled
                className="w-full px-4 py-3 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 h-24 resize-none"
              placeholder="Enter restaurant address"
            />
          </div>
        </div>

        {/* Logo Upload */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Restaurant Logo</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                disabled={uploading}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {uploading && (
                <p className="text-sm text-blue-600 mt-2">📤 Uploading logo...</p>
              )}
            </div>

            {form.logo && (
              <div className="flex items-center gap-4">
                <p className="text-sm text-green-600">✅ Logo uploaded!</p>
                <img
                  src={form.logo}
                  alt="Restaurant Logo"
                  className="w-20 h-20 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
