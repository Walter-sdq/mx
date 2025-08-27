import express from 'express';
const router = express.Router();
// TODO: Implement trade logic
router.get('/', (req, res) => {
  res.json({ message: 'Trades endpoint' });
});
export default router;
