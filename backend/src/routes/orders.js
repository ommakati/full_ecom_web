import express from 'express'
import { query, getClient } from '../database/connection.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// ================= CREATE ORDER =================
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId
    const sessionId = req.sessionID

    if (!sessionId) {
      return res.status(400).json({ error: "No session found" })
    }

    const cartResult = await query(`
      SELECT ci.product_id, ci.quantity, p.name, p.price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.session_id = $1
    `, [sessionId])

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ error: "Cart is empty" })
    }

    const totalAmount = cartResult.rows.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    const client = await getClient()

    try {
      await client.query('BEGIN')

      const orderResult = await client.query(`
        INSERT INTO orders (user_id, total_amount, status)
        VALUES ($1, $2, 'pending')
        RETURNING *
      `, [userId, totalAmount])

      const order = orderResult.rows[0]

      for (const item of cartResult.rows) {
        await client.query(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES ($1, $2, $3, $4)
        `, [order.id, item.product_id, item.quantity, item.price])
      }

      await client.query('DELETE FROM cart_items WHERE session_id = $1', [sessionId])

      await client.query('COMMIT')
      client.release()

      res.status(201).json(order)

    } catch (error) {
      await client.query('ROLLBACK')
      client.release()
      throw error
    }

  } catch (error) {
    console.error("❌ CREATE ORDER ERROR:", error)
    res.status(500).json({ error: error.message })
  }
})


// ================= USER ORDERS =================
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId

    const result = await query(`
      SELECT id, user_id, total_amount, status, created_at
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId])

    res.json({
      orders: result.rows,
      total_orders: result.rows.length
    })

  } catch (error) {
    console.error("❌ USER ORDERS ERROR:", error)
    res.status(500).json({ error: error.message })
  }
})


// ================= ADMIN ALL ORDERS (FIXED 🔥) =================
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    console.log("SESSION:", req.session)

    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    // ✅ SAFE QUERY (NO JOIN → no crash)
    const result = await query(`
      SELECT id, user_id, total_amount, status, created_at
      FROM orders
      ORDER BY created_at DESC
    `)

    res.json({
      orders: result.rows,
      total_orders: result.rows.length
    })

  } catch (error) {
    console.error("❌ ADMIN ORDERS ERROR:", error)

    res.status(500).json({
      error: error.message
    })
  }
})


// ================= UPDATE STATUS =================
router.patch('/admin/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const result = await query(
      'UPDATE orders SET status=$1 WHERE id=$2 RETURNING *',
      [status, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" })
    }

    res.json(result.rows[0])

  } catch (error) {
    console.error("❌ UPDATE STATUS ERROR:", error)
    res.status(500).json({ error: error.message })
  }
})

export default router