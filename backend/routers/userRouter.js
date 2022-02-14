import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import { generateToken, protect } from "../utils.js";

const userRouter = express.Router();

//search user by name or email
userRouter.get('/searchUser',protect, async(req, res) => {
    const keyword = req.query.search ? {
        $or: [
            { name: {$regex: req.query.search, $options: "i"}},
            { email: { $regex: req.query.search, $options: "i"}},
        ],
    } : {};

    const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
    res.send(users);
});

//register a new user
userRouter.post('/register' ,async(req, res) => {
    const user = await User.findOne({email: req.body.email});
    if(user){
        res.status(400).send({message: "Email already registered!"})
    } else{
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 8),
            pic: req.body.pic,
            isAdmin: req.body.isAdmin
        });
        const createdUser = await user.save();
        res.send({
            _id: createdUser._id,
            name: createdUser.name,
            email: createdUser.email,
            pic: createdUser.pic,
            isAdmin: createdUser.isAdmin,
            token: generateToken(createdUser)
        })
    }
});


//login register
userRouter.post('/login',async(req,res) => {
    const user = await User.findOne({email: req.body.email});
    if(user){
        if(bcrypt.compareSync(req.body.password, user.password)){
            res.status(200).send({
                _id: user._id,
                name: user.name,
                email: user.email,
                pic: user.pic,
                isAdmin: user.isAdmin,
                token: generateToken(user)
            })
        } else{
            res.status(404).send({message: "Wrong password"});
        }
    } else {
        res.status(404).send({message: "Email not registered"})
    }
});

export default userRouter;
