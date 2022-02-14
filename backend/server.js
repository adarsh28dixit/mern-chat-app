import express from "express";
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors';
import userRouter from "./routers/userRouter.js";
import chatRouter from "./routers/chatRouter.js";
import messageRouter from "./routers/messageRouter.js";
import {Server} from 'socket.io';
import path from 'path';

dotenv.config();
const app = express()
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ["GET", "POST", "PUT", "DELETE"],
    
}))


mongoose.connect('mongodb+srv://adarsh:adarsh44@cluster0.fg29u.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})



app.use('/api', userRouter);
app.use('/api', chatRouter);
app.use('/api', messageRouter);

// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------


const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>{
    console.log('http://localhost:5000')
})


//socket implementation

const io = new Server(server, {
    pingTimeout: 60000,
    cors : {
        origin : "http://localhost:3000",
    }
})

io.on("connection", (socket) => {
    console.log("connected to socket.io");

    socket.on("setup", (userData) => {
        socket.join(userData._id);
        //console.log(userData._id);
        socket.emit("connected");
    })

    socket.on("join chat", (room) => {
        socket.join(room);
        console.log('User joined room:' + room);
    })

    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
    

    socket.on('new message', (newMessageRecieved) => {
        var chat = newMessageRecieved.chat;

        if(!chat.users){
            return console.log("chat.users not defined");
        }

        chat.users.forEach((user) => {
            if(user._id == newMessageRecieved.sender._id){
                return ;
            }

            socket.in(user._id).emit("message recieved", newMessageRecieved);

        });
    })


})