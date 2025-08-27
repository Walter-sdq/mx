import express from 'express';
const router = express.Router();
// TODO: Implement price logic
router.get('/', (req, res) => {
  res.json({ message: 'Prices endpoint' });
});
export default router;
