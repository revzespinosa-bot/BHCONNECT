const pool = require('../config/db');
const { createAlert } = require('./alertService');

async function deductInventory(itemId, quantity, patientId, performedBy, notes = null) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [items] = await conn.execute('SELECT * FROM inventory_items WHERE id = ? FOR UPDATE', [itemId]);
    if (items.length === 0) throw new Error('Inventory item not found');

    const item = items[0];
    if (item.quantity < quantity) throw new Error(`Insufficient stock for ${item.item_name}`);

    const newQty = item.quantity - quantity;
    await conn.execute('UPDATE inventory_items SET quantity = ? WHERE id = ?', [newQty, itemId]);

    await conn.execute(
      `INSERT INTO inventory_transactions (item_id, transaction_type, quantity, patient_id, performed_by, notes)
       VALUES (?, 'deduction', ?, ?, ?, ?)`,
      [itemId, quantity, patientId, performedBy, notes]
    );

    if (newQty <= item.low_stock_threshold) {
      await createAlert(
        'low_stock',
        `Low Stock: ${item.item_name}`,
        `${item.item_name} stock (${newQty} ${item.unit}) is at or below threshold (${item.low_stock_threshold} ${item.unit})`,
        'inventory',
        itemId
      );
    }

    await conn.commit();
    return { itemId, newQuantity: newQty, itemName: item.item_name };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function restockInventory(itemId, quantity, performedBy, notes = null) {
  const [items] = await pool.execute('SELECT * FROM inventory_items WHERE id = ?', [itemId]);
  if (items.length === 0) throw new Error('Inventory item not found');

  const newQty = items[0].quantity + quantity;
  await pool.execute('UPDATE inventory_items SET quantity = ? WHERE id = ?', [newQty, itemId]);

  await pool.execute(
    `INSERT INTO inventory_transactions (item_id, transaction_type, quantity, performed_by, notes)
     VALUES (?, 'restock', ?, ?, ?)`,
    [itemId, quantity, performedBy, notes]
  );

  return { itemId, newQuantity: newQty, itemName: items[0].item_name };
}

module.exports = { deductInventory, restockInventory };
