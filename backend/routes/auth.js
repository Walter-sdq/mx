import express from 'express';
const router = express.Router();
// TODO: Implement authentication logic
router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint' });
});
router.post('/signup', (req, res) => {
  res.json({ message: 'Signup endpoint' });
});
export default router;
