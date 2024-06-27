import { Request, Response } from 'express';
import { google, gmail_v1 } from 'googleapis';

const googleOAuth = async (req: Request, res: Response) => {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
        process.env.GOOGLE_REDIRECT_URI!
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

const fetchEmails = async (req: Request, res: Response) => {
    try {
        // Get tokens from request headers in Postman
        const accessToken = req.header('access_token'); // Assuming the access token is passed in the Authorization header
        const refreshToken = req.header('refresh_token');
        const expiryDate = req.header('expiry_date');
        console.log(accessToken)
        if (!accessToken || !refreshToken || !expiryDate) {
            return res.status(401).send('Access token, refresh token, or expiry date missing in headers.');
        }

        // Create OAuth client
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID!,
            process.env.GOOGLE_CLIENT_SECRET!,
            process.env.GOOGLE_REDIRECT_URI!
        );

        // Set credentials from headers
        oAuth2Client.setCredentials({
            access_token: req.headers['access_token'] as string,
            refresh_token: req.headers['refresh_token'] as string,
            expiry_date: Number(req.headers['expiry_date']),
        });

        // Initialize Gmail API
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        // Example: Fetch unread emails
        const gmailResponse = await gmail.users.messages.list({
            userId: 'me',
            q: 'is:unread',
        });

        const messages = gmailResponse.data.messages || [];

        // Process each email message
        for (const message of messages) {
            const email = await gmail.users.messages.get({
                userId: 'me',
                id: message.id!,
                format: 'full',
            });

            // Process the email content here
            console.log('Email:', email.data.snippet); // Example: Log email snippet

            // Implement further processing or analysis here
        }

        res.status(200).send('Emails fetched and processed.');
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).send('Error fetching emails.');
    }
};



export { fetchEmails, googleOAuth};