import express from "express";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import { protect } from "../utils.js";

const messageRouter = express.Router();

// get all messages
messageRouter.get("/getMessages/:id", protect, async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.id })
      .populate("sender", "name pic email")
      .populate("chat");
    res.send(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//send message
messageRouter.post("/sendMessage", protect, async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res.status(400).send({ msg: "Invalid data passed into request" });
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });
    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.send(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

export default messageRouter;
