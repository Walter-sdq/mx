import express from 'express';
const router = express.Router();
// TODO: Implement user management logic
router.get('/', (req, res) => {
  res.json({ message: 'Users endpoint' });
});
export default router;
