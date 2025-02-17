import express from 'express';
import connect from './db/db.js';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRoute from './routes/user.route.js';
import projectRoute from './routes/project.route.js';   
import aiRoutes from './routes/ai.route.js'
connect();

const app=express();

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use('/user',userRoute);
app.use('/project',projectRoute);
app.use('/ai',aiRoutes);

app.get('/',(req,res)=>{
    res.send('Hello World');
})

export default app;