import { Request, Response } from 'express';
import { google } from 'googleapis';
import OpenAI from 'openai';


require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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
        // Get tokens from request headers
        const accessToken = req.header('access_token');
        const refreshToken = req.header('refresh_token');
        const expiryDate = req.header('expiry_date');
        
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
            access_token: accessToken!,
            refresh_token: refreshToken!,
            expiry_date: Number(expiryDate),
        });

        // Initialize Gmail API
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        // Fetch unread emails from specific sender
        const gmailResponse = await gmail.users.messages.list({
            userId: 'me',
            q: 'from:210108040@hbtu.ac.in is:unread', // Add the specific sender and unread filter
        });

        const messages = gmailResponse.data.messages || [];

        if (messages.length === 0) {
            console.log('No unread emails from the specified sender.');
            return res.status(200).send('No unread emails from the specified sender.');
        }

        // Process each email message
        for (const message of messages) {
            const email = await gmail.users.messages.get({
                userId: 'me',
                id: message.id!,
                format: 'full',
            });

            // Process the email content here
            // console.log('Email:', email.data.snippet); // Example: Log email snippet
            const emailContent = email.data.snippet;
            
            const openaiResponse = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are an email assistant.' },
                    { role: 'user', content: `Analyze the following email content and determine the context:\n\n${emailContent}` }
                ],
            });

            const analysis = openaiResponse.choices[0].message?.content;
            console.log('Analysis:', analysis);

            
        }
      
       
            

        // res.status(200).send('Emails fetched and processed.');


    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).send('Error fetching emails.');
    }
};

export default fetchEmails;


export { fetchEmails, googleOAuth};