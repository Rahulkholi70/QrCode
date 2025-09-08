'use client';
import { useEffect, useState } from 'react';

interface MenuItem {
  _id?: string;
  name: string;
  price: number;
  category: string;
  image?: string;
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState({ name: '', price: '', category: '', image: '' });
  const [filter, setFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({
    message: '',
    type: null,
  });
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

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

  // Fetch menu items
  const fetchItems = async () => {
    const token = getTokenFromCookie();
    const res = await fetch('/api/vendor/menu/list', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setItems(data.items || []);
  };

  useEffect(() => {
    fetchItems();
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
        setForm({ ...form, image: data.imageUrl });
        showToast('✅ Image uploaded successfully!', 'success');
      } else {
        showToast(data.error || '❌ Failed to upload image!', 'error');
      }
    } catch (error) {
      showToast('❌ Failed to upload image!', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Add Item
 const handleAdd = async () => {
  // Validation: Ensure name and price are provided
  if (!form.name.trim() || !form.price || Number(form.price) <= 0) {
    showToast('⚠️ Please enter a valid item name and price.', 'error');
    return;
  }

  if (editingItem) {
    // If editing, call update handler instead
    await handleUpdate();
    return;
  }

  const token = getTokenFromCookie();
  const res = await fetch('/api/vendor/menu/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...form, token }),
  });

  if (res.ok) {
    await fetchItems();
    setForm({ name: '', price: '', category: '', image: '' });
    showToast('✅ Item added successfully!', 'success');
  } else {
    showToast('❌ Failed to add item!', 'error');
  }
};

  // Update Item
  const handleUpdate = async () => {
    if (!editingItem) return;

    // Validation: Ensure name and price are provided
    if (!form.name.trim() || !form.price || Number(form.price) <= 0) {
      showToast('⚠️ Please enter a valid item name and price.', 'error');
      return;
    }

    const token = getTokenFromCookie();
    const res = await fetch('/api/vendor/menu/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ oldName: editingItem.name, name: form.name, price: Number(form.price) }),
    });

    if (res.ok) {
      await fetchItems();
      setForm({ name: '', price: '', category: '', image: '' });
      setEditingItem(null);
      showToast('✅ Item updated successfully!', 'success');
    } else {
      showToast('❌ Failed to update item!', 'error');
    }
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditingItem(null);
    setForm({ name: '', price: '', category: '', image: '' });
  };
  // Delete Item
  const handleDelete = async (itemId: string) => {
    const token = getTokenFromCookie();
    const res = await fetch('/api/vendor/menu/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, itemId }),
    });

    if (res.ok) {
      await fetchItems();
      showToast('🗑 Item deleted!', 'success');
    } else {
      showToast('❌ Failed to delete item!', 'error');
    }
  };

  // Edit Item
  const handleEdit = (itemId: string) => {
    const item = items.find((i) => i._id === itemId);
    if (item) {
      setEditingItem(item);
      setForm({
        name: item.name,
        price: item.price.toString(),
        category: item.category,
        image: item.image || '',
      });
    }
  };

  const filteredItems = filter === 'all' ? items : items.filter((item) => item.category === filter);

  return (
    <div className="max-w-6xl mx-auto relative">
      {/* Toast Notification - Better mobile positioning */}
      <div
        className={`fixed top-4 right-4 sm:top-5 sm:right-5 z-[9999] transition-all duration-300 transform ${
          toast.type ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        } px-3 sm:px-4 py-3 sm:py-4 rounded-lg shadow-lg text-white text-sm sm:text-base max-w-xs sm:max-w-sm ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}
      >
        {toast.message}
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">🍽 Menu Management</h1>

      {/* Add Item Form - Improved mobile layout */}
      <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
          {editingItem ? '✏️ Edit Item' : '➕ Add New Item'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="Item Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border px-3 sm:px-4 py-2 sm:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm sm:text-base"
          />
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border px-3 sm:px-4 py-2 sm:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm sm:text-base"
          />
          <select className="border px-3 sm:px-4 py-2 sm:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm sm:text-base"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })} 
            >
            <option value="" disabled>Select Category</option>
            <option value="starter">Starter</option>
            <option value="main">Main</option>
            <option value="dessert">Dessert</option>
            <option value="drink">Drink</option>
          </select>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Food Image
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
              className="border px-3 sm:px-4 py-2 sm:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 w-full text-sm sm:text-base"
            />
            {uploading && (
              <p className="text-sm text-blue-600 mt-1">📤 Uploading image...</p>
            )}
            {form.image && (
              <div className="mt-2 flex items-center gap-3">
                <p className="text-sm text-green-600">✅ Image uploaded!</p>
                <img
                  src={form.image}
                  alt="Preview"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-6">
          <button
            onClick={handleAdd}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 sm:py-3 rounded-lg transition font-medium text-sm sm:text-base"
          >
            {editingItem ? 'Update Item' : 'Add Item'}
          </button>
          {editingItem && (
            <button
              onClick={handleCancelEdit}
              className="px-4 sm:px-6 bg-gray-500 hover:bg-gray-600 text-white py-2 sm:py-3 rounded-lg transition font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Filter Dropdown - Better mobile layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold">Your Menu</h2>
        <select
          className="border px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-sm focus:ring-2 focus:ring-green-400 w-full sm:w-auto text-sm sm:text-base"
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="starter">Starter</option>
          <option value="main">Main</option>
          <option value="dessert">Dessert</option>
          <option value="drink">Drink</option>
        </select>
      </div>

      {/* Menu Items by Category - Improved mobile layout */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="text-4xl sm:text-6xl mb-4">🍳</div>
          <p className="text-base sm:text-lg text-gray-500">No menu items yet. Start by adding one!</p>
        </div>
      ) : (
        (() => {
          // Group items by category
          const groupedItems = filteredItems.reduce((acc, item) => {
            const category = item.category || 'Other';
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(item);
            return acc;
          }, {} as Record<string, MenuItem[]>);

          return Object.entries(groupedItems).map(([category, items]) => (
            <section key={category} className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 capitalize border-b-2 border-green-300 pb-2">
                {category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {items.map((item, index) => (
                  <div
                    key={item._id || `${item.name}-${index}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-32 sm:h-40 w-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="p-3 sm:p-4">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-semibold text-base sm:text-lg flex-1">{item.name}</h4>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded whitespace-nowrap">
                          ₹ {item.price}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 capitalize">{item.category}</p>
                      <button
                        onClick={() => item._id && handleDelete(item._id)}
                        className="mt-3 text-red-500 text-xs sm:text-sm cursor-pointer hover:text-red-700 transition-colors"
                      >
                        🗑 Delete
                      </button>
                       <button
                        onClick={() => item._id && handleEdit(item._id)}
                        className="mt-3 ml-3 text-green-500 text-xs sm:text-sm cursor-pointer hover:text-green-700 transition-colors"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ));
        })()
      )}
    </div>
  );
} 