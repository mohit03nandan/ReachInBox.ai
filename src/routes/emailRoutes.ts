import { Router } from 'express';
import { googleOAuth } from '../controllers/emailController';

const router = Router();

router.get('/google-oauth', googleOAuth);

export default router;