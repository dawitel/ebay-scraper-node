import express from 'express';
import uploadRouter from './routes/upload.route';
import sendRouter from './routes/send.route';
import scrapeRouter from './routes/scrape.route';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/send', sendRouter);
app.use('/api/v1/scrape', scrapeRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
