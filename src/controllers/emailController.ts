import { Request, Response } from 'express';
import { google } from 'googleapis';

const googleOAuth = async (req: Request, res: Response) => {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    if (!req.query.code) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/gmail.readonly']
        });
        console.log('Redirecting to:', authUrl);  // Log the auth URL
        res.redirect(authUrl);
    } else {
        const { code } = req.query;
        console.log('Received code:', code);  // Log the received code
        try {
            const { tokens } = await oAuth2Client.getToken(code as string);
            oAuth2Client.setCredentials(tokens);
            console.log('Tokens:', tokens);  // Log the tokens
            res.send('Google OAuth setup completed.');
        } catch (error) {
            console.error('Error getting tokens:', error);
            res.status(500).send('Error during Google OAuth setup.');
        }
    }
};

export { googleOAuth };
