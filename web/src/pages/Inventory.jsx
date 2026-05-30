import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    api.getInventory(lowStockOnly).then(setItems).catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, [lowStockOnly]);

  const handleRestock = async (id, itemName) => {
    const qty = prompt(`Restock quantity for ${itemName}:`, '50');
    if (!qty) return;
    try {
      const result = await api.restockInventory(id, { quantity: Number(qty), notes: 'Manual restock' });
      setMessage(`${result.itemName} restocked. New quantity: ${result.newQuantity}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeduct = async (id, itemName) => {
    const qty = prompt(`Deduct quantity for ${itemName}:`, '1');
    if (!qty) return;
    try {
      const result = await api.deductInventory(id, { quantity: Number(qty), notes: 'Used during visit' });
      setMessage(`${result.itemName} deducted. Remaining: ${result.newQuantity}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Inventory & Supplies</h2>
          <p>Track medicines, vaccines, and clinic supplies</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="toolbar">
        <label className="checkbox-label">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Show low stock only
        </label>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Threshold</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isLow = item.quantity <= item.low_stock_threshold;
              return (
                <tr key={item.id} className={isLow ? 'row-danger' : ''}>
                  <td>{item.item_name}</td>
                  <td>{item.category}</td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>{item.low_stock_threshold} {item.unit}</td>
                  <td>{isLow ? <span className="badge badge-danger">Low Stock</span> : <span className="badge badge-ok">OK</span>}</td>
                  <td className="actions">
                    <button type="button" className="btn btn-sm" onClick={() => handleDeduct(item.id, item.item_name)}>Deduct</button>
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => handleRestock(item.id, item.item_name)}>Restock</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
