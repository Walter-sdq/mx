import express from 'express';
const router = express.Router();
// TODO: Implement withdrawal logic
router.get('/', (req, res) => {
  res.json({ message: 'Withdrawals endpoint' });
});
export default router;
