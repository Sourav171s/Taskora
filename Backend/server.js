import express from 'express'
import cors from 'cors';      //used to connect frontend and backend which are running on different ports
import 'dotenv/config'
import { connectDB } from './config/db.js';
import userRouter from './routes/userRoute.js'
import taskRouter from './routes/taskRoute.js';

const app = express()
const port = process.env.PORT || 4000;

//Middleware
app.use(cors());
app.use(express.json());               //without this req.body becomes undefined
app.use(express.urlencoded({ extended : true }))   //Allow Express to read form data sent in request body and convert it into JavaScript object and not json object    

//DB connect
connectDB();

//Routes
app.use("/api/user",userRouter)
app.use("/api/tasks",taskRouter)

app.get('/',(req,res)=>{                      //health check route
    res.send('API Working');
})

app.listen(port,()=>{
    console.log(`Server Started on http://localhost:${port}`)
})