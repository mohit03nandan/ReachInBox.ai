import { Router } from 'express';
import { googleOAuth,fetchEmails } from '../controllers/emailController';
// import { microsoftOAuth } from '../controllers/emailController';

const router = Router();

router.get('/google-oauth', googleOAuth);

router.get('/fetch', fetchEmails);

export default router;