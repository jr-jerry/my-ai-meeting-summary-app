// Load environment variables from .env file
require('dotenv').config();

//Import express module
const express=require('express');

// Import Groq SDK
const { Groq } = require('groq-sdk');

// Import Nodemailer
const nodemailer = require('nodemailer');

// Initialize Groq client with API key from environment variables
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

//Import cors module 
const cors =require('cors');

//Create Instance of express application
const app=express();

//server will listen on this port 
const PORT=process.env.PORT || 3000;

//fitting cors in app
app.use(cors());


app.use(express.json());

app.get('/',(req,res)=>{
    res.json({ message: 'Server is running' });
})

// Make the route handler async to use await for the Groq API call
app.post('/api/summary', async (req,res)=>{
    try {
        const {transcript,prompt}=req.body;

        console.log('Received for summarization :');
        console.log('Transcript snippet:', transcript ? transcript.substring(0, 100) + '...' : 'no transcript found');
        console.log('Prompt:', prompt);

        // Construct the payload for the Groq API
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert in summarizing meeting transcripts accurately and concisely."
                },
                {
                    role: "user",
                    // We combine the transcript and the user's prompt into a single message
                    content: `Please summarize the following meeting transcript based on the prompt.\n\nPrompt: "${prompt}"\n\nTranscript:\n${transcript}`
                }
            ],
            // A recommended model for chat and summarization tasks
            model: "llama3-8b-8192",
            temperature: 1,
            max_tokens: 1024,
            top_p: 1,
            stream: false, // We set stream to false to get the full response at once
        });

        const summary = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a summary.";

        res.json({ sum: summary });

    } catch (error) {
        console.error('Error calling Groq API:', error);
        res.status(500).json({ error: 'Failed to generate summary.' });
    }
})

app.post('/api/share-email', async (req,res)=>{
    try {
        const {summary,email} = req.body;

        // 1. Create a Nodemailer transporter using Gmail service
        //    It will use the credentials from your .env file
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 2. Define the email options
        const mailOptions = {
            from: process.env.EMAIL_USER, // sender address
            to: email || "jerryverma915@gmail.com", // list of receivers
            subject: 'Your AI Meeting Summary', // Subject line
            html: `<p>Here is your meeting summary:</p><pre>${summary}</pre>`, // html body
        };

        // 3. Send the email
        const send_email=await transporter.sendMail(mailOptions);

        console.log(`Email sent successfully to ${email}`);
        res.status(200).json({ 
            message: 'Email sent successfully!',
            'send email':send_email
         });

    } catch (error) {
        console.error('Error sending email:', error);
        // Provide a more specific error message if possible
        res.status(500).json({ error: 'Failed to send email.', details: error.message });
    }

})



app.listen(PORT,()=>{
    console.log(`server is running on http://localhost:${PORT}`)
})
